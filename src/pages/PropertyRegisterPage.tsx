import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./propertyRegister.css";

const propertyTypes = ["원룸", "투룸", "오피스텔"];
const options = ["에어컨", "세탁기", "냉장고", "침대", "책상", "반려동물 협의"];

export function PropertyRegisterPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(propertyTypes[0]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(["에어컨", "냉장고"]);
  const [modelFileName, setModelFileName] = useState("sample-room.scene.json");
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
    setSaved(true);
  };

  return (
    <main className="property-register">
      <div className="property-register__frame">
        <header className="property-register__header">
          <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <BackIcon />
          </button>
          <h1>매물 등록</h1>
          <button type="button" onClick={() => navigate("/viewer")}>
            3D
          </button>
        </header>

        <form className="property-register__form" onSubmit={handleSubmit}>
          <section className="property-register__upload">
            <label>
              <input
                type="file"
                accept=".json,.glb,.gltf,.ply,.splat,.ksplat"
                onChange={(event) =>
                  setModelFileName(event.target.files?.[0]?.name ?? modelFileName)
                }
              />
              <span>
                <CubeIcon />
                <strong>3D 모델 파일</strong>
                <small>{modelFileName}</small>
              </span>
            </label>
            <button type="button" onClick={() => navigate("/viewer")}>
              미리보기
            </button>
          </section>

          <section className="property-register__section">
            <h2>기본 정보</h2>
            <div className="property-register__field">
              <label htmlFor="address">주소</label>
              <input id="address" name="address" defaultValue="서울 동작구 상도동" />
            </div>
            <div className="property-register__field-grid">
              <div className="property-register__field">
                <label htmlFor="deposit">보증금</label>
                <input id="deposit" name="deposit" defaultValue="500" inputMode="numeric" />
              </div>
              <div className="property-register__field">
                <label htmlFor="rent">월세</label>
                <input id="rent" name="rent" defaultValue="55" inputMode="numeric" />
              </div>
            </div>
          </section>

          <section className="property-register__section">
            <h2>매물 유형</h2>
            <div className="property-register__segments" role="group" aria-label="매물 유형">
              {propertyTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={type === selectedType ? "is-active" : ""}
                  onClick={() => setSelectedType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>

          <section className="property-register__section">
            <h2>상세 조건</h2>
            <div className="property-register__field-grid">
              <div className="property-register__field">
                <label htmlFor="size">면적</label>
                <input id="size" name="size" defaultValue="21.4m²" />
              </div>
              <div className="property-register__field">
                <label htmlFor="availableDate">입주 가능일</label>
                <input id="availableDate" name="availableDate" defaultValue="즉시" />
              </div>
            </div>
            <div className="property-register__checks">
              {options.map((option) => (
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

          {saved && (
            <p className="property-register__saved" role="status">
              로컬 프로토타입에 임시 저장되었습니다.
            </p>
          )}

          <div className="property-register__actions">
            <button type="button" onClick={() => navigate("/home")}>
              취소
            </button>
            <button type="submit">등록하기</button>
          </div>
        </form>
      </div>
    </main>
  );
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />
      <path d="M3.3 7.5L12 12l8.7-4.5" />
      <path d="M12 22V12" />
    </svg>
  );
}
