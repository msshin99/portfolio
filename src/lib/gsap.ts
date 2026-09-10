import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(ScrollTrigger, CustomEase);

/** 파티클 인트로(Preloader)가 글자 모임 -> 그리드 재배열 트윈에 공통으로 쓰는 이징.
 *  처음엔 cubic-bezier(0.25, 0.1, 0.25, 1)(=CSS 기본 ease)로 스냅감 있게 만들었는데,
 *  지속시간이 짧게 붙으니 "급하게 튕기는" 느낌이 강했다 — 도착부에서 아주 천천히
 *  잦아드는 expo-out 계열(0.16, 1, 0.3, 1)로 바꿔서, 파티클이 미끄러지듯 부드럽게
 *  제자리에 안착하는 느낌을 낸다(이 사이트의 다른 reveal 애니메이션에서도 쓰는 커브). */
CustomEase.create("particleEase", "0.16, 1, 0.3, 1");

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, CustomEase };
