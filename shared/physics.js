/**
 * ==========================================
 * 共通物理シミュレーションライブラリ
 * ==========================================
 * 全てのスケッチで使い回したい物理定数や
 * 計算ロジックをここにまとめます。
 * 
 * 【使い方】
 * 各スケッチで必要なものだけ import して使います。
 * 例: import { GRAVITY, applyGravity } from '../../shared/physics.js';
 */

// 重力加速度 (ピクセル/秒^2 などの単位系を想定)
export const GRAVITY = 9.8;

// 摩擦係数 (1.0で摩擦なし、0.98などで徐々に減速するような簡易表現用)
export const FRICTION = 0.98;

// 空気抵抗の係数 (0に近いほど抵抗が少ない)
export const DRAG_COEFFICIENT = 0.01;

// デフォルトの反発係数 (1で完全弾性衝突、0で跳ね返らない)
export const DEFAULT_RESTITUTION = 0.8;

/**
 * 【ルールの追加例1】速度に重力を適用する単純な関数
 * @param {number} velocity - 現在の速度
 * @param {number} delta - 経過時間 (スケール済みの値)
 * @returns {number} 重力適用後の速度
 */
export function applyGravity(velocity, delta) {
  return velocity + GRAVITY * delta;
}

/**
 * 【ルールの追加例2】空気抵抗を計算する
 * 速度の二乗に比例する抵抗（よりリアルな挙動に必要）を返します。
 * @param {number} velocity - 現在の速度
 * @returns {number} 抵抗力
 */
export function calculateDrag(velocity) {
  // 進行方向と逆向きに抵抗力をかけるため Math.sign を使用
  return -Math.sign(velocity) * DRAG_COEFFICIENT * velocity * velocity;
}
