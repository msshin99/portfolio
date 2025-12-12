document.addEventListener("DOMContentLoaded", function () {
  const menuButton = document.querySelector("#header .mo-menu");
  const gnb = document.querySelector("#header > ul.gnb");
  const moNavOpen = document.querySelector("#header .mo-nav-open");

  const body = document.body;

  menuButton.addEventListener("click", function () {
    menuButton.classList.toggle("active");

    gnb.classList.toggle("is-open");

    moNavOpen.classList.toggle("is-open");
  });
});

$(document).ready(function () {
  const header = $("#header");
  const scrollThreshold = 50;

  function checkScroll() {
    if ($(window).scrollTop() > scrollThreshold) {
      header.addClass("scrolled");
    } else {
      header.removeClass("scrolled");
    }
  }

  // 1. 페이지 로드 시 초기 상태 확인
  checkScroll();

  // 2. 스크롤 이벤트 발생 시 함수 실행
  $(window).on("scroll", checkScroll);
});
