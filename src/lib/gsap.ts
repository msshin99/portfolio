import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(ScrollTrigger, CustomEase);

/** 파티클 인트로(Preloader)가 글자 모임 -> 그리드 재배열 트윈에 공통으로 쓰는, 스냅감
 *  있는 커스텀 이징. cubic-bezier(0.25, 0.1, 0.25, 1) 기반. */
CustomEase.create("particleSnap", "0.25, 0.1, 0.25, 1");

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, CustomEase };
