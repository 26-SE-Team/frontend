import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { saveCertificationDraft } from "../services/prototypeStorage";
import "./certification.css";

export function CertificationPage() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    saveCertificationDraft({
      agentName: String(formData.get("agent-name") ?? ""),
      agentNumber: String(formData.get("agent-number") ?? ""),
      officeName: String(formData.get("office-name") ?? ""),
      fileName: fileName || undefined,
    });
    setSubmitted(true);
  };

  return (
    <main className="cert-page">
      <div className="cert-page__frame">
        <header className="cert-page__header">
          <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <BackIcon />
          </button>
          <h1>중개사 인증</h1>
          <p>
            중개사 인증 완료 후
            <br />
            매물 등록 기능을 사용할 수 있습니다.
          </p>
        </header>

        <form className="cert-form" onSubmit={handleSubmit}>
          <TextField id="agent-name" label="이름" />
          <TextField id="agent-number" label="중개사 번호" />
          <TextField id="office-name" label="사무소명" />

          <label className="cert-upload">
            <span>사업자 등록증</span>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(event) =>
                setFileName(event.target.files?.[0]?.name ?? "")
              }
            />
            <strong>
              <ImageIcon />
              {fileName || "업로드하기"}
            </strong>
          </label>

          {submitted && (
            <p className="cert-form__status" role="status">
              인증 요청이 접수되었습니다.
            </p>
          )}

          <button className="cert-form__submit" type="submit">
            인증 요청하기
          </button>
        </form>
      </div>
    </main>
  );
}

function TextField({ id, label }: { id: string; label: string }) {
  return (
    <label className="cert-field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} name={id} placeholder="입력하기" />
    </label>
  );
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="M21 15l-4.5-4.5L7 19" />
    </svg>
  );
}
