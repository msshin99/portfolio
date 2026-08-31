import img01 from "../assets/keyword/img-01.png";
import img02 from "../assets/keyword/img-02.png";
import img03 from "../assets/keyword/img-03.png";
import img04 from "../assets/keyword/img-04.png";

export interface KeywordItem {
  num: string;
  title: string;
  sub: string;
  image: string;
}

export const keywords: KeywordItem[] = [
  { num: "01.", title: "선동 동력", sub: "Ability to Lead", image: img01 },
  { num: "02.", title: "경험 유영", sub: "Experience Swimming", image: img02 },
  { num: "03.", title: "구조적 심도", sub: "Structural Depth", image: img03 },
  { num: "04.", title: "가치 확산", sub: "Spread of Value", image: img04 },
];
