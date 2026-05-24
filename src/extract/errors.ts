export class ExtractionError extends Error {
  constructor(
    message: string,
    readonly code:
      | "install-not-found"
      | "invalid-install-path"
      | "required-data-file-missing"
      | "unsupported-passive-tree-source"
      | "parse-failure",
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}
