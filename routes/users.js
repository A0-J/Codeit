import express from 'express';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../env.js'; // env.js에서 JWT_SECRET 가져오기

const userRouter = express.Router();

// 사용자 등록
userRouter.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 필수 필드 검증
    if (!username || !email || !password) {
      return res.status(400).json({ message: "필수 필드를 입력해 주세요." });
    }

    // 사용자 생성
    const user = new User({ username, email, password });
    await user.save();

    // 성공적으로 사용자 생성됨을 응답
    return res.status(201).json({ message: "사용자 등록 성공" });
  } catch (error) {
    return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
  }
});

// 사용자 로그인
userRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 필수 필드 검증
    if (!username || !password) {
      return res.status(400).json({ message: "필수 필드를 입력해 주세요." });
    }

    // 사용자 찾기
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 비밀번호 검증
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "비밀번호가 틀렸습니다." });
    }

    // JWT 토큰 생성
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({ token });
  } catch (error) {
    return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
  }
});

// 사용자 정보 조회 (JWT 필요)
userRouter.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "인증이 필요합니다." });

    // JWT 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

    return res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
  }
});

// 비밀번호 변경
userRouter.patch('/me/password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "인증이 필요합니다." });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ message: "필수 필드를 입력해 주세요." });

    // 기존 비밀번호 검증
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return res.status(401).json({ message: "기존 비밀번호가 틀렸습니다." });

    // 비밀번호 변경
    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: "비밀번호가 성공적으로 변경되었습니다." });
  } catch (error) {
    return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
  }
});

// 사용자 정보 업데이트
userRouter.patch('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "인증이 필요합니다." });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

    const { username, email, profilePicture } = req.body;

    // 필수 필드 검증
    if (!username && !email && !profilePicture) {
      return res.status(400).json({ message: "업데이트할 필드를 입력해 주세요." });
    }

    // 사용자 정보 업데이트
    if (username) user.username = username;
    if (email) user.email = email;
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();

    return res.status(200).json({ message: "사용자 정보가 성공적으로 업데이트되었습니다." });
  } catch (error) {
    return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
  }
});

// 사용자 로그아웃
userRouter.post('/logout', (req, res) => {
  try {
    // 클라이언트에서 로그아웃 요청을 보낼 때, 보통 서버에서는 별도의 처리를 하지 않고 클라이언트에서 토큰을 삭제하거나 만료시키는 방식을 사용합니다.
    // 서버 측에서 로그아웃 처리 방식은 다양할 수 있으며, 예를 들어, 블랙리스트에 토큰을 추가하는 방식이 있습니다.

    return res.status(200).json({ message: "로그아웃 성공" });
  } catch (error) {
    return res.status(500).json({ message: "서버 오류가 발생했습니다", error });
  }
});

export default userRouter;
