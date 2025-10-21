const skills = new Swiper(".skill", {
  // 1. 슬라이드 방향을 'vertical'로 설정
  direction: "vertical",

  // 2. 한 번에 보여줄 슬라이드의 개수를 1개로 설정
  slidesPerView: 1,

  // 3. 슬라이드 간격 (수직 간격)
  spaceBetween: 0,

  // 4. 무한 루프
  loop: true,

  // 5. 자동 재생 설정
  autoplay: {
    delay: 2000,
    disableOnInteraction: false,
  },
});
