# 1단계: 빌드 환경 (Node.js 환경)
FROM node:20 AS build
WORKDIR /app

# 종속성 패키지 파일 복사 및 설치
COPY package*.json ./
RUN npm install

# 전체 소스 복사
COPY . .

# 빌드 시점에 백엔드 API 주소를 주입받아 빌드에 반영
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# 정적 파일 빌드 (dist 폴더 생성)
RUN npm run build

# 2단계: 실행 환경 (Nginx 경량화 이미지 사용)
FROM nginx:alpine

# 빌드 완료된 정적 파일들을 Nginx 기본 웹서버 디렉토리로 복사
COPY --from=build /app/dist /usr/share/nginx/html

# 방금 작성한 React 전용 Nginx 설정 적용
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 웹 서비스 포트 개방
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
