package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.entities.Order;
import com.nexcoffee.managementsystem.entities.OrderDetail;
import com.nexcoffee.managementsystem.entities.Product;
import com.nexcoffee.managementsystem.entities.ProductImage;
import com.nexcoffee.managementsystem.entities.ProductVariant;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class OrderMailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private final String UPLOAD_DIR = "uploads/";

    private static final Locale VI_LOCALE = Locale.forLanguageTag("vi-VN");
    private static final NumberFormat MONEY_FORMAT = NumberFormat.getInstance(VI_LOCALE);
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public void sendOrderSuccessEmail(Order order, String receiverEmail) {
        if (order == null || receiverEmail == null || receiverEmail.isBlank()) {
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage,
                    true,
                    "UTF-8"
            );

            List<InlineMailImage> inlineImages = new ArrayList<>();
            String htmlContent = buildOrderSuccessHtml(order, inlineImages);

            helper.setFrom(fromEmail);
            helper.setTo(receiverEmail);
            helper.setSubject("NexCoffee xác nhận đơn hàng #" + order.getCode());
            helper.setText(htmlContent, true);

            for (InlineMailImage image : inlineImages) {
                helper.addInline(image.contentId(), image.path().toFile());
            }

            mailSender.send(mimeMessage);
        } catch (Exception exception) {
            System.err.println("Không thể gửi email xác nhận đơn hàng "
                    + order.getCode()
                    + ": "
                    + exception.getMessage());
        }
    }

    private String buildOrderSuccessHtml(Order order, List<InlineMailImage> inlineImages) {
        StringBuilder itemsHtml = new StringBuilder();

        if (order.getOrderDetails() != null) {
            for (OrderDetail detail : order.getOrderDetails()) {
                itemsHtml.append(buildItemRow(detail, inlineImages));
            }
        }

        String createdAt = order.getCreatedAt() == null
                ? LocalDateTime.now().format(DATE_FORMATTER)
                : order.getCreatedAt().format(DATE_FORMATTER);

        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Xác nhận đơn hàng</title>
                </head>
                <body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#2b2b2b;">
                    <div style="max-width:680px;margin:0 auto;background:#ffffff;padding:32px 36px;">
                
                        <div style="text-align:left;margin-bottom:22px;">
                            <div style="font-size:32px;font-weight:800;color:#5b2f1c;letter-spacing:0.5px;">
                                NexCoffee
                            </div>
                            <div style="font-size:13px;color:#8a6a58;margin-top:4px;">
                                Cà phê cho ngày mới
                            </div>
                        </div>
                
                        <p style="font-size:14px;line-height:1.6;margin:0 0 14px;">
                            Xin chào <strong>%s</strong>,
                        </p>
                
                        <p style="font-size:14px;line-height:1.6;margin:0 0 14px;">
                            Cảm ơn Anh/chị đã đặt hàng tại <strong>NexCoffee</strong>.
                        </p>
                
                        <p style="font-size:14px;line-height:1.6;margin:0 0 26px;">
                            Đơn hàng của Anh/chị đã được tiếp nhận. Chúng tôi sẽ nhanh chóng liên hệ và giao đơn hàng đến Anh/chị trong thời gian sớm nhất.
                        </p>
                
                        <div style="height:1px;background:#d8d8d8;margin:22px 0;"></div>
                
                        <table style="width:100%%;border-collapse:collapse;margin-bottom:24px;">
                            <tr>
                                <td style="width:50%%;vertical-align:top;padding:0 18px 18px 0;">
                                    <h3 style="font-size:17px;margin:0 0 12px;color:#333;">Thông tin mua hàng</h3>
                                    <p style="font-size:14px;line-height:1.6;margin:0;">
                                        %s<br>
                                        <a href="mailto:%s" style="color:#1468e3;text-decoration:none;">%s</a><br>
                                        %s
                                    </p>
                                </td>
                
                                <td style="width:50%%;vertical-align:top;padding:0 0 18px 18px;">
                                    <h3 style="font-size:17px;margin:0 0 12px;color:#333;">Địa chỉ nhận hàng</h3>
                                    <p style="font-size:14px;line-height:1.6;margin:0;">
                                        %s<br>
                                        %s<br>
                                        %s
                                    </p>
                                </td>
                            </tr>
                
                            <tr>
                                <td style="width:50%%;vertical-align:top;padding:12px 18px 18px 0;">
                                    <h3 style="font-size:17px;margin:0 0 12px;color:#333;">Phương thức thanh toán</h3>
                                    <p style="font-size:14px;line-height:1.6;margin:0;">
                                        %s
                                    </p>
                                </td>
                
                                <td style="width:50%%;vertical-align:top;padding:12px 0 18px 18px;">
                                    <h3 style="font-size:17px;margin:0 0 12px;color:#333;">Phương thức vận chuyển</h3>
                                    <p style="font-size:14px;line-height:1.6;margin:0;">
                                        Giao hàng tận nơi<br>
                                        Phí vận chuyển: <strong>%s</strong>
                                    </p>
                                </td>
                            </tr>
                        </table>
                
                        <h3 style="font-size:17px;margin:0 0 14px;color:#333;">Thông tin đơn hàng</h3>
                
                        <table style="width:100%%;border-collapse:collapse;margin-bottom:16px;">
                            <tr>
                                <td style="font-size:14px;padding-bottom:8px;">
                                    Mã đơn hàng: <strong>#%s</strong>
                                </td>
                                <td style="font-size:14px;text-align:right;padding-bottom:8px;">
                                    Ngày đặt hàng: %s
                                </td>
                            </tr>
                        </table>
                
                        <div style="border-top:1px solid #eeeeee;border-bottom:1px solid #eeeeee;">
                            %s
                        </div>
                
                        <table style="width:100%%;border-collapse:collapse;margin-top:18px;">
                            <tr>
                                <td style="font-size:14px;padding:6px 0;color:#555;">Giảm giá:</td>
                                <td style="font-size:14px;padding:6px 0;text-align:right;font-weight:700;">%s</td>
                            </tr>
                            <tr>
                                <td style="font-size:14px;padding:6px 0;color:#555;">Tạm tính:</td>
                                <td style="font-size:14px;padding:6px 0;text-align:right;font-weight:700;">%s</td>
                            </tr>
                            <tr>
                                <td style="font-size:14px;padding:6px 0;color:#555;">Phí vận chuyển:</td>
                                <td style="font-size:14px;padding:6px 0;text-align:right;font-weight:700;">%s</td>
                            </tr>
                            <tr>
                                <td style="font-size:16px;padding:12px 0 4px;color:#333;font-weight:700;">Thành tiền</td>
                                <td style="font-size:18px;padding:12px 0 4px;text-align:right;font-weight:800;color:#5b2f1c;">%s</td>
                            </tr>
                        </table>
                
                        <div style="margin-top:28px;padding-top:18px;border-top:1px solid #eeeeee;font-size:13px;color:#777;line-height:1.6;">
                            Email này được gửi tự động từ hệ thống NexCoffee. Vui lòng không trả lời email này.
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                escape(order.getFullName()),
                escape(order.getFullName()),
                safeEmail(order),
                safeEmail(order),
                escape(order.getPhone()),
                escape(order.getFullName()),
                escape(order.getAddress()),
                escape(order.getPhone()),
                displayPaymentMethod(order),
                formatMoney(order.getShipping()),
                escape(order.getCode()),
                createdAt,
                itemsHtml.toString(),
                formatMoney(order.getDiscount()),
                formatMoney(order.getSubtotal()),
                formatMoney(order.getShipping()),
                formatMoney(order.getTotal())
        );
    }

    private String buildItemRow(OrderDetail detail, List<InlineMailImage> inlineImages) {
        ProductVariant variant = detail.getProductVariant();
        Product product = variant.getProduct();

        String productName = product == null ? "Sản phẩm" : product.getName();

        String size = variant.getSize() == null || variant.getSize().isBlank()
                ? "Mặc định"
                : variant.getSize();

        String imageHtml = buildProductImageHtml(product, detail, inlineImages);

        return """
                <table style="width:100%%;border-collapse:collapse;">
                    <tr>
                        <td style="width:86px;padding:16px 0;vertical-align:top;">
                            %s
                        </td>
                        <td style="padding:16px 12px;vertical-align:top;">
                            <div style="font-size:14px;font-weight:700;color:#b91c1c;margin-bottom:8px;">
                                %s
                            </div>
                            <div style="font-size:13px;color:#555;margin-bottom:8px;">
                                %s
                            </div>
                            <div style="font-size:13px;color:#777;">
                                %s × %d
                            </div>
                        </td>
                        <td style="padding:16px 0;vertical-align:bottom;text-align:right;font-size:14px;font-weight:700;color:#333;">
                            %s
                        </td>
                    </tr>
                </table>
                """.formatted(
                imageHtml,
                escape(productName),
                escape(size),
                formatMoney(detail.getUnitPrice()),
                detail.getQuantity(),
                formatMoney(detail.getTotalPrice())
        );
    }

    private String buildProductImageHtml(
            Product product,
            OrderDetail detail,
            List<InlineMailImage> inlineImages
    ) {
        Path imagePath = getProductMainImagePath(product);

        if (imagePath == null) {
            return """
                    <div style="width:72px;height:72px;border:1px solid #eeeeee;background:#f8f8f8;display:flex;align-items:center;justify-content:center;color:#999;font-size:12px;">
                        Nex
                    </div>
                    """;
        }

        String contentId = "product_image_" + inlineImages.size() + "_" + System.nanoTime();
        inlineImages.add(new InlineMailImage(contentId, imagePath));

        String productName = product == null ? "Sản phẩm" : product.getName();

        return """
                <img src="cid:%s" alt="%s" style="width:72px;height:72px;object-fit:cover;border:1px solid #eeeeee;">
                """.formatted(contentId, escape(productName));
    }

    private Path getProductMainImagePath(Product product) {
        if (product == null || product.getImages() == null || product.getImages().isEmpty()) {
            return null;
        }

        return product.getImages()
                .stream()
                .filter(image -> Boolean.TRUE.equals(image.getIsMain()))
                .findFirst()
                .map(ProductImage::getImageUrl)
                .filter(imageUrl -> imageUrl != null && !imageUrl.isBlank())
                .map(imageUrl -> {
                    String fileName = imageUrl;

                    if (fileName.startsWith("/images/")) {
                        fileName = fileName.replace("/images/", "");
                    }

                    Path path = Paths.get(UPLOAD_DIR + fileName);

                    return Files.exists(path) ? path : null;
                })
                .orElse(null);
    }

    private String displayPaymentMethod(Order order) {
        if (order.getPaymentMethod() == null) {
            return "Thanh toán khi nhận hàng (COD)";
        }

        return switch (order.getPaymentMethod()) {
            case COD -> "Thanh toán khi nhận hàng (COD)";
            default -> order.getPaymentMethod().name();
        };
    }

    private String safeEmail(Order order) {
        return order.getEmail() == null || order.getEmail().isBlank()
                ? ""
                : escape(order.getEmail());
    }

    private String formatMoney(Long value) {
        long safeValue = value == null ? 0L : value;
        return MONEY_FORMAT.format(safeValue) + " VND";
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private record InlineMailImage(
            String contentId,
            Path path
    ) {
    }
}