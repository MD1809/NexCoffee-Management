package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.request.cart.AddCartItemRequest;
import com.nexcoffee.managementsystem.dto.request.cart.UpdateCartItemRequest;
import com.nexcoffee.managementsystem.dto.response.cart.CartItemResponse;
import com.nexcoffee.managementsystem.dto.response.cart.CartResponse;
import com.nexcoffee.managementsystem.entities.Cart;
import com.nexcoffee.managementsystem.entities.CartItem;
import com.nexcoffee.managementsystem.entities.Product;
import com.nexcoffee.managementsystem.entities.ProductImage;
import com.nexcoffee.managementsystem.entities.ProductVariant;
import com.nexcoffee.managementsystem.entities.User;
import com.nexcoffee.managementsystem.enums.CartStatus;
import com.nexcoffee.managementsystem.enums.ProductVariantStatus;
import com.nexcoffee.managementsystem.enums.ProductsStatus;
import com.nexcoffee.managementsystem.repositories.CartItemRepository;
import com.nexcoffee.managementsystem.repositories.CartRepository;
import com.nexcoffee.managementsystem.repositories.ProductVariantRepository;
import com.nexcoffee.managementsystem.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public CartResponse getCart(String cartToken) {
        User currentUser = getCurrentUserOrNull();

        Cart cart = null;

        if (currentUser != null) {
            cart = cartRepository
                    .findByUserAndStatus(currentUser, CartStatus.ACTIVE)
                    .orElse(null);
        } else if (cartToken != null && !cartToken.trim().isEmpty()) {
            cart = cartRepository
                    .findByCartTokenAndStatus(cartToken.trim(), CartStatus.ACTIVE)
                    .orElse(null);
        }

        if (cart == null) {
            return emptyCartResponse();
        }

        return toCartResponse(cart);
    }

    @Transactional
    public CartResponse addItem(String cartToken, AddCartItemRequest request) {
        if (request.getVariantId() == null) {
            throw new RuntimeException("Thiếu biến thể sản phẩm.");
        }

        int quantity = request.getQuantity() == null ? 1 : request.getQuantity();

        if (quantity < 1) {
            throw new RuntimeException("Số lượng phải lớn hơn 0.");
        }

        ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy biến thể sản phẩm."));

        validateVariantCanBuy(variant);

        Cart cart = resolveCart(cartToken);

        CartItem cartItem = cartItemRepository
                .findByCartAndProductVariant(cart, variant)
                .orElse(null);

        if (cartItem == null) {
            cartItem = CartItem.builder()
                    .cart(cart)
                    .productVariant(variant)
                    .quantity(quantity)
                    .unitPrice(variant.getPrice())
                    .build();
        } else {
            cartItem.setQuantity(cartItem.getQuantity() + quantity);
        }

        cartItemRepository.save(cartItem);

        Cart latestCart = cartRepository.findById(cart.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng."));

        return toCartResponse(latestCart);
    }

    @Transactional
    public CartResponse updateItem(String cartToken, Long cartItemId, UpdateCartItemRequest request) {
        if (cartItemId == null) {
            throw new RuntimeException("Thiếu mã sản phẩm trong giỏ hàng.");
        }

        int quantity = request.getQuantity() == null ? 1 : request.getQuantity();

        if (quantity < 1) {
            throw new RuntimeException("Số lượng phải lớn hơn 0.");
        }

        Cart cart = resolveCart(cartToken);

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm trong giỏ hàng."));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Sản phẩm không thuộc giỏ hàng hiện tại.");
        }

        validateVariantCanBuy(cartItem.getProductVariant());

        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);

        Cart latestCart = cartRepository.findById(cart.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng."));

        return toCartResponse(latestCart);
    }

    @Transactional
    public CartResponse removeItem(String cartToken, Long cartItemId) {
        if (cartItemId == null) {
            throw new RuntimeException("Thiếu mã sản phẩm trong giỏ hàng.");
        }

        Cart cart = resolveCart(cartToken);

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm trong giỏ hàng."));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Sản phẩm không thuộc giỏ hàng hiện tại.");
        }

        boolean removed = cart.getItems().removeIf(
                item -> item.getId().equals(cartItemId)
        );

        if (!removed) {
            throw new RuntimeException("Không thể xóa sản phẩm khỏi giỏ hàng.");
        }

        cartRepository.saveAndFlush(cart);

        return toCartResponse(cart);
    }

    @Transactional
    public CartResponse mergeGuestCart(String cartToken) {
        User currentUser = getCurrentUserOrNull();

        if (currentUser == null) {
            throw new RuntimeException("Bạn cần đăng nhập để gộp giỏ hàng.");
        }

        Cart userCart = findOrCreateUserCart(currentUser);

        // Cart của user tuyệt đối không được giữ guest token
        if (userCart.getCartToken() != null) {
            userCart.setCartToken(null);
            userCart = cartRepository.save(userCart);
        }

        if (cartToken == null || cartToken.trim().isEmpty()) {
            return toCartResponse(userCart);
        }

        Cart guestCart = cartRepository
                .findByCartTokenAndStatus(cartToken.trim(), CartStatus.ACTIVE)
                .orElse(null);

        if (guestCart == null) {
            return toCartResponse(userCart);
        }

        // Nếu token này không phải guest cart thật thì không merge
        if (guestCart.getUser() != null) {
            return toCartResponse(userCart);
        }

        if (guestCart.getId().equals(userCart.getId())) {
            return toCartResponse(userCart);
        }

        List<CartItem> guestItems = new ArrayList<>(guestCart.getItems());

        for (CartItem guestItem : guestItems) {
            ProductVariant variant = guestItem.getProductVariant();

            if (variant == null || variant.getProduct() == null) {
                continue;
            }

            CartItem existingUserItem = cartItemRepository
                    .findByCartAndProductVariant(userCart, variant)
                    .orElse(null);

            if (existingUserItem == null) {
                CartItem newUserItem = CartItem.builder()
                        .cart(userCart)
                        .productVariant(variant)
                        .quantity(guestItem.getQuantity())
                        .unitPrice(guestItem.getUnitPrice())
                        .build();

                cartItemRepository.save(newUserItem);
            } else {
                existingUserItem.setQuantity(
                        existingUserItem.getQuantity() + guestItem.getQuantity()
                );

                cartItemRepository.save(existingUserItem);
            }
        }

        // Xóa guest cart sau khi đã copy toàn bộ item sang user cart
        guestCart.getItems().clear();
        cartRepository.delete(guestCart);
        cartRepository.flush();

        Cart latestUserCart = cartRepository.findById(userCart.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng người dùng."));

        return toCartResponse(latestUserCart);
    }

    private Cart resolveCart(String cartToken) {
        User currentUser = getCurrentUserOrNull();

        if (currentUser != null) {
            return findOrCreateUserCart(currentUser);
        }

        if (cartToken != null && !cartToken.trim().isEmpty()) {
            return cartRepository
                    .findByCartTokenAndStatus(cartToken.trim(), CartStatus.ACTIVE)
                    .orElseGet(this::createGuestCart);
        }

        return createGuestCart();
    }

    private Cart findOrCreateUserCart(User user) {
        Cart cart = cartRepository.findByUserAndStatus(user, CartStatus.ACTIVE)
                .orElseGet(() -> cartRepository.save(
                        Cart.builder()
                                .user(user)
                                .cartToken(null)
                                .status(CartStatus.ACTIVE)
                                .build()
                ));

        if (cart.getCartToken() != null) {
            cart.setCartToken(null);
            cart = cartRepository.save(cart);
        }

        return cart;
    }

    private Cart createGuestCart() {
        return cartRepository.save(
                Cart.builder()
                        .cartToken(UUID.randomUUID().toString())
                        .status(CartStatus.ACTIVE)
                        .build()
        );
    }

    private User getCurrentUserOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null) {
            return null;
        }

        if (!authentication.isAuthenticated()) {
            return null;
        }

        if (authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }

        String email = authentication.getName();

        if (email == null || email.isBlank() || "anonymousUser".equals(email)) {
            return null;
        }

        return userRepository.findByEmail(email).orElse(null);
    }

    private void validateVariantCanBuy(ProductVariant variant) {
        if (variant == null) {
            throw new RuntimeException("Biến thể sản phẩm không hợp lệ.");
        }

        if (variant.getStatus() != ProductVariantStatus.available) {
            throw new RuntimeException("Biến thể sản phẩm hiện không khả dụng.");
        }

        Product product = variant.getProduct();

        if (product == null) {
            throw new RuntimeException("Sản phẩm không hợp lệ.");
        }

        if (product.getStatus() != ProductsStatus.active) {
            throw new RuntimeException("Sản phẩm hiện không hoạt động.");
        }
    }

    private CartResponse toCartResponse(Cart cart) {
        List<CartItemResponse> itemResponses = cart.getItems()
                .stream()
                .sorted(Comparator.comparing(CartItem::getId))
                .map(this::toCartItemResponse)
                .toList();

        int totalQuantity = itemResponses.stream()
                .mapToInt(CartItemResponse::getQuantity)
                .sum();

        double totalAmount = itemResponses.stream()
                .mapToDouble(CartItemResponse::getLineTotal)
                .sum();

        return CartResponse.builder()
                .id(cart.getId())
                .cartToken(cart.getUser() == null ? cart.getCartToken() : null)
                .items(itemResponses)
                .totalQuantity(totalQuantity)
                .totalAmount(totalAmount)
                .build();
    }

    private CartItemResponse toCartItemResponse(CartItem item) {
        ProductVariant variant = item.getProductVariant();
        Product product = variant.getProduct();

        double lineTotal = item.getUnitPrice() * item.getQuantity();

        return CartItemResponse.builder()
                .id(item.getId())
                .productId(product.getId())
                .productName(product.getName())
                .variantId(variant.getId())
                .size(variant.getSize())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .lineTotal(lineTotal)
                .imageUrl(getMainImageUrl(product))
                .build();
    }

    private String getMainImageUrl(Product product) {
        if (product == null || product.getImages() == null || product.getImages().isEmpty()) {
            return null;
        }

        ProductImage mainImage = product.getImages()
                .stream()
                .filter(image -> Boolean.TRUE.equals(image.getIsMain()))
                .findFirst()
                .orElse(product.getImages().get(0));

        return mainImage.getImageUrl();
    }
    private CartResponse emptyCartResponse() {
        return CartResponse.builder()
                .id(null)
                .cartToken(null)
                .items(List.of())
                .totalQuantity(0)
                .totalAmount(0.0)
                .build();
    }
}