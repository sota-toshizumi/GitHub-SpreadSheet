export class UniqueId {
  repoId: string;
  issueId: string;

  constructor(repoId: number, issueId: number) {
    // 文字列として扱わないと、おかしくなる
    this.repoId = repoId.toString();
    this.issueId = issueId.toString();
  }

  // 文字列を受け取り、このクラスを作成する
  // 失敗したらnullを返す
  static from(s: string) {
    try {
      const parsed = JSON.parse(s);
      if ('repoId' in parsed && 'issueId' in parsed) return parsed;
      else return null;
    } catch {
      return null;
    }
  }

  toString() {
    return JSON.stringify(this);
  }

  // 同一かどうか確認する
  isSame(other: UniqueId) {
    return this.repoId === other.repoId && this.issueId === other.issueId;
  }
}
