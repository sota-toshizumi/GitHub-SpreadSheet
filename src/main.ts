import { doPost, onOpen } from "./triggers";

// GAS側から参照したい関数
(global as any).doPost = doPost;
(global as any).onOpen = onOpen;
