export const showCartToast = (payload) => {
  window.dispatchEvent(
    new CustomEvent("cart-toast:show", {
      detail: payload,
    }),
  );
};
