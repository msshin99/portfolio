import figma from "../assets/skills/figma.png";
import figmaH from "../assets/skills/figma-h.png";
import photoshop from "../assets/skills/photoshop.png";
import photoshopH from "../assets/skills/photoshop-h.png";
import html from "../assets/skills/html.png";
import htmlH from "../assets/skills/html-h.png";
import ils from "../assets/skills/ils.png";
import ilsH from "../assets/skills/ils-h.png";
import css from "../assets/skills/css.png";
import cssH from "../assets/skills/css-h.png";
import code from "../assets/skills/code.png";
import codeH from "../assets/skills/code-h.png";
import js from "../assets/skills/js.png";
import jsH from "../assets/skills/js-h.png";
import github from "../assets/skills/github.png";
import githubH from "../assets/skills/github-h.png";

export interface SkillSlide {
  key: string;
  image: string;
  imageHover: string;
  /** .swiper-slide.{key}::before 배경색 */
  hoverBg: string;
}

/** section.skills ul.skill-list의 li 4개, 각각 세로 스와이퍼 안에 슬라이드 2개 */
export const skillGroups: [SkillSlide, SkillSlide][] = [
  [
    { key: "figma", image: figma, imageHover: figmaH, hoverBg: "#fff" },
    { key: "photoshop", image: photoshop, imageHover: photoshopH, hoverBg: "#001e36" },
  ],
  [
    { key: "html", image: html, imageHover: htmlH, hoverBg: "#e34c26" },
    { key: "ils", image: ils, imageHover: ilsH, hoverBg: "#330000" },
  ],
  [
    { key: "css", image: css, imageHover: cssH, hoverBg: "#264de4" },
    { key: "code", image: code, imageHover: codeH, hoverBg: "#0877b9" },
  ],
  [
    { key: "js", image: js, imageHover: jsH, hoverBg: "#f0db4f" },
    { key: "github", image: github, imageHover: githubH, hoverBg: "#fff" },
  ],
];
