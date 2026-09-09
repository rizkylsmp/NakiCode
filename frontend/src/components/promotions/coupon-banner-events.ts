export const couponBannerReopenEvent = "naki:coupon-banner-reopen";

export function requestCouponBannerReopen() {
  window.dispatchEvent(new Event(couponBannerReopenEvent));
}
