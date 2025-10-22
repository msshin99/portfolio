const skills = new Swiper(".skill", {
  direction: "vertical",

  slidesPerView: 1,

  spaceBetween: 0,
  loop: true,

  autoplay: {
    delay: 2000,
    disableOnInteraction: false,
  },
});

const device = new Swiper(".device", {
  slidesPerView: 1,
  spaceBetween: 0,
  loop: true,
  // 1. 오토플레이 비활성화 (Autoplay disabled)
  // autoplay: {
  //   delay: 2000,
  //   disableOnInteraction: false,
  // },

  // 2. 페이지네이션 추가 (Pagination added)
  pagination: {
    el: ".swiper-pagination",
    clickable: true, // 페이지네이션 점을 클릭하여 이동 가능하게 설정
  },

  // 3. 좌우 네비게이션 버튼 추가 (Navigation buttons added)
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  // 4. 마우스 커서로 슬라이드 가능하게 설정 (Mouse cursor drag enabled)
  // Swiper 5 이상에서는 기본적으로 활성화되어 있을 수 있지만, 명시적으로 설정
  grabCursor: true,

  // 마우스휠이나 키보드 등의 추가적인 드래그 옵션
  mousewheel: false, // 마우스 휠 슬라이드 (필요시 true로 변경)
  keyboard: {
    enabled: true, // 키보드 네비게이션 (필요시 true로 변경)
    onlyInViewport: true,
  },
});
