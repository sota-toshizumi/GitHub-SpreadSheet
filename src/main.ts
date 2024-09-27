import { moveCompletedIssuesToCompleteSheet } from "./moveCompletedIssuesToCompleteSheet";
import { doPost, onOpen } from "./triggers";

// GAS側から参照したい関数
(global as any).doPost = doPost;
(global as any).onOpen = onOpen;

(global as any).moveCompletedIssuesToCompleteSheet =
  moveCompletedIssuesToCompleteSheet;
