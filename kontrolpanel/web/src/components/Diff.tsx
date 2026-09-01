import type { DiffFile } from "../types";

function toLines(text: string): string[] {
  return text.length === 0 ? [] : text.split("\n");
}

/**
 * Before/after per file. No unified-diff parsing — the change builder stores the
 * two versions verbatim, and I want to read them as they are.
 */
export function Diff({ files }: { files: DiffFile[] }) {
  if (files.length === 0) {
    return <p className="note">Ingen kodeændring på denne opgave endnu.</p>;
  }

  return (
    <div className="diff">
      {files.map((file) => (
        <div className="diff-file" key={file.filnavn}>
          <p className="diff-filename">{file.filnavn}</p>
          <div className="diff-columns">
            <div className="diff-column diff-before">
              <p className="diff-heading">Før</p>
              <pre>
                {toLines(file.før).map((line, i) => (
                  <code key={i} className="diff-line">
                    <span className="diff-number">{i + 1}</span>
                    <span className="diff-text">{line || " "}</span>
                  </code>
                ))}
              </pre>
            </div>
            <div className="diff-column diff-after">
              <p className="diff-heading">Efter</p>
              <pre>
                {toLines(file.efter).map((line, i) => (
                  <code key={i} className="diff-line">
                    <span className="diff-number">{i + 1}</span>
                    <span className="diff-text">{line || " "}</span>
                  </code>
                ))}
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
