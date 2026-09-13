/** 사이트 전역 문구의 기본값(코드에 하드코딩된 "관리자가 아직 안 건드렸을 때"
 *  보여줄 값)을 한곳에 모아둔 순수 데이터 파일. Home.tsx/Hero.tsx/About.tsx 같은
 *  실제 페이지 컴포넌트와 admin/AdminSiteContent.tsx가 이 파일을 함께 참조한다.
 *
 *  왜 컴포넌트 파일에서 바로 export하지 않고 이 파일로 분리했는가: Hero.tsx는
 *  Hero3DLogo.tsx를 import하는데, 그 파일 최상단에는 `useGLTF.preload(logoUrl)`
 *  처럼 "모듈이 로드되는 즉시" 실행되는 부수효과가 있다. admin 페이지가 Hero.tsx
 *  에서 기본값 상수만 가져오려 해도 그 import 체인을 타고 3D 로고 GLB(1MB+)를
 *  불필요하게 미리 받아오게 된다 — 이 파일은 그런 부수효과가 있는 컴포넌트를
 *  전혀 import하지 않으므로 안전하다. */

export const DEFAULT_HERO_LABEL = "Design &\nPublishing";
export const DEFAULT_HERO_TAGLINE = "Structured in process,\ncrafted with care.";
export const DEFAULT_HERO_STATEMENT = "MADE TO WORK,\nNOT JUST LOOK";
export const DEFAULT_HERO_BIO =
  "I see every project from planning to implementation,\ndelivering results that go beyond what's visible.";
export const DEFAULT_HERO_BIO_KO =
  "저는 기획부터 구현까지 프로젝트 전체를 책임지고,\n보이는 것 이상의 결과로 이어지게 만듭니다.";

export const DEFAULT_INTRO_HEADING =
  "Design moves people. And people move the world. Design is not just what we see it’s how we feel, remember, and connect.";
export const DEFAULT_INTRO_DESCRIPTION =
  "사소한 요소 하나에도 의미를 담고, 그 안에서 공감과 연결의 순간을 만들어내는 디자인을 추구합니다. 나의 디자인은 '어떻게 보일까'보다 '어떻게 느껴질까'를 더 깊이 고민합니다. 저는 디자인을 통해 사람들의 하루에 잔잔한 변화를 만들고, 기억에 남는 경험과 진심이 닿는 브랜드를 만들어가고자 합니다.";

export const DEFAULT_WORKS_SUBTXT = "(Professional)";
export const DEFAULT_WORKS_TITLE = "My Works";
export const DEFAULT_WORKS_DESCRIPTION =
  "제가 경험한 과정, 고민의 흔적, 그리고 디자인을 통해 사람들과 나눈 감정의 이야기들입니다. 각 프로젝트는 서로 다른 목적과 문제를 가지고 있었지만, 그 안에서 저는 항상 사람과의 연결, 공감, 그리고 의미 있는 변화를 찾고자 했습니다";

export const DEFAULT_SKILLS_SUBTXT = "(Capabilities)";
export const DEFAULT_SKILLS_TITLE = "Skills";

export const DEFAULT_ABOUT_HEADING = "모두를 집중시키는 디자이너 신민석입니다";
export const DEFAULT_ABOUT_HEADING_EN = "A designer who commands everyone's attention.";
export const DEFAULT_ABOUT_DESCRIPTION =
  "언제나 남들과 다른 시각으로 디자인을 바라보며, 평범함 속에 숨겨진 새로운 가능성을 발견하고, 익숙한 것들에서 비범함을 이끌어냅니다.";
export const DEFAULT_ABOUT_INFO_SUBTXT = "(Profile)";
export const DEFAULT_ABOUT_INFO_TITLE = "Info";
export const DEFAULT_ABOUT_INFO_DESCRIPTION = "항목을 눌러 자세한 내용을 펼쳐보세요.";
