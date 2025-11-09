document.addEventListener("DOMContentLoaded", function () {
  const menuButton = document.querySelector("#header .mo-menu");
  const gnb = document.querySelector("#header > ul.gnb");
  const moNavOpen = document.querySelector("#header .mo-nav-open");

  // ✅ body 요소를 선택합니다.
  const body = document.body;

  menuButton.addEventListener("click", function () {
    // 1. 햄버거 버튼 클래스 토글 (X자 모양으로 변경)
    menuButton.classList.toggle("active");

    // 2. GNB 메뉴 클래스 토글 (메뉴 열기/닫기)
    // (참고: GNB는 미디어 쿼리에서 'display: none'이므로, 여기서 토글하는 'is-open' 클래스는 CSS에 정의되지 않은 듯합니다. 모바일에서는 moNavOpen이 메인 메뉴 역할을 하는 것으로 보입니다.)
    gnb.classList.toggle("is-open");

    // 3. mo-nav-open 요소 클래스 토글 (배경 오버레이 나타나거나 사라짐)
    moNavOpen.classList.toggle("is-open");
  });
});
