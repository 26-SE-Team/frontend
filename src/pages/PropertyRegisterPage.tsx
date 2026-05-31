import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { savePrototypeListingDraft } from "../services/prototypeStorage";
import "./propertyRegister.css";

const optionItems = ["주차", "반려동물"];

export function PropertyRegisterPage() {
  const navigate = useNavigate();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [modelFileName, setModelFileName] = useState("");
  const [saved, setSaved] = useState(false);

  const toggleOption = (option: string) => {
    setSelectedOptions((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option]
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    savePrototypeListingDraft({
      address: String(formData.get("address") ?? ""),
      price: String(formData.get("price") ?? ""),
      size: String(formData.get("size") ?? ""),
      availableDate: String(formData.get("availableDate") ?? ""),
      options: selectedOptions,
      modelFileName: modelFileName || undefined,
    });
    setSaved(true);
  };

  return (
    <main className="property-register">
      <div className="property-register__frame">
        <header className="property-register__header">
          <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <BackIcon />
          </button>
          <h1>매물 등록하기</h1>
        </header>

        <form className="property-register__form" onSubmit={handleSubmit}>
          <TextField id="address" label="주소" defaultValue="서울 동작구 상도동" />
          <TextField id="price" label="가격" defaultValue="월세 500/31" />
          <TextField id="size" label="면적" defaultValue="26.44m²" />
          <TextField id="availableDate" label="입주 가능일" defaultValue="즉시" />

          <section className="property-register__options" aria-labelledby="register-options">
            <h2 id="register-options">옵션 선택</h2>
            <div>
              {optionItems.map((option) => (
                <label key={option}>
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option)}
                    onChange={() => toggleOption(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </section>

          <label className="property-register__upload">
            <input
              type="file"
              accept="image/*,.json,.glb,.gltf,.ply,.splat,.ksplat"
              onChange={(event) =>
                setModelFileName(event.target.files?.[0]?.name ?? "")
              }
            />
            <span>
              <CubeIcon />
              <strong>공간 모델 / 매물 이미지 등록</strong>
              {modelFileName && <small>{modelFileName}</small>}
            </span>
          </label>

          {saved && (
            <p className="property-register__saved" role="status">
              매물 등록이 완료되었습니다.
            </p>
          )}

          <button type="submit" className="property-register__submit">
            매물 등록하기
          </button>
        </form>
      </div>
    </main>
  );
}

function TextField({
  id,
  label,
  defaultValue,
}: {
  id: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <label className="property-register__field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} name={id} placeholder="입력하기" defaultValue={defaultValue} />
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

function CubeIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />
      <path d="M3.3 7.5L12 12l8.7-4.5" />
      <path d="M12 22V12" />
    </svg>
  );
}
