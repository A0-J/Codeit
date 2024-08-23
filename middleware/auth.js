import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../env.js'; // env.js에서 JWT_SECRET 가져오기

/**
 * JWT 토큰을 생성하는 함수
 * @param {string} userId - 사용자 ID 또는 페이로드
 * @returns {string} 생성된 JWT 토큰
 */
export const generateToken = (userId) => {
  // JWT 토큰 생성
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
};

/**
 * JWT 토큰을 검증하는 함수
 * @param {string} token - 검증할 JWT 토큰
 * @param {function} callback - 검증 결과를 처리할 콜백 함수
 */
export const verifyToken = (token, callback) => {
  // JWT 토큰 검증
  jwt.verify(token, JWT_SECRET, callback);
};
