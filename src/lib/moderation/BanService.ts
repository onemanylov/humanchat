import type { EnvLike } from '../../../party/utils/env';
import { redisGET, redisSET, redisEXPIRE, redisDEL } from '../../../party/utils/redis';
import type { BanStatus } from './types';
import { MODERATION_CONFIG } from './config';

export class BanService {
  private source: EnvLike;

  constructor(source: EnvLike) {
    this.source = source;
  }

  private getTempBanKey(wallet: string): string {
    return `user:tempban:${wallet}`;
  }

  private getPermBanKey(wallet: string): string {
    return `user:permban:${wallet}`;
  }

  async applyTempBan(wallet: string, reason: string): Promise<void> {
    try {
      const key = this.getTempBanKey(wallet);
      const banData = {
        reason,
        bannedAt: Date.now(),
        expiresAt: Date.now() + (MODERATION_CONFIG.TEMP_BAN_DURATION_HOURS * 60 * 60 * 1000),
      };

      await redisSET(this.source, key, JSON.stringify(banData));
      await redisEXPIRE(this.source, key, MODERATION_CONFIG.TEMP_BAN_DURATION_HOURS * 60 * 60);
    } catch (error) {
      console.error('Failed to apply temp ban:', error);
    }
  }

  async applyPermBan(wallet: string, reason: string): Promise<void> {
    try {
      const key = this.getPermBanKey(wallet);
      const banData = {
        reason,
        bannedAt: Date.now(),
      };

      await redisSET(this.source, key, JSON.stringify(banData));
      
      // Also remove any temp ban since perm ban supersedes it
      await this.removeTempBan(wallet);
    } catch (error) {
      console.error('Failed to apply permanent ban:', error);
    }
  }

  async removeTempBan(wallet: string): Promise<void> {
    try {
      const key = this.getTempBanKey(wallet);
      await redisDEL(this.source, key);
    } catch (error) {
      console.error('Failed to remove temp ban:', error);
    }
  }

  async getBanStatus(wallet: string): Promise<BanStatus> {
    try {
      // Check permanent ban first
      const permKey = this.getPermBanKey(wallet);
      const permBanData = await redisGET(this.source, permKey);
      
      if (permBanData) {
        const banInfo = JSON.parse(permBanData);
        return {
          isBanned: true,
          isTemporary: false,
          reason: banInfo.reason,
        };
      }

      // Check temporary ban
      const tempKey = this.getTempBanKey(wallet);
      const tempBanData = await redisGET(this.source, tempKey);
      
      if (tempBanData) {
        const banInfo = JSON.parse(tempBanData);
        const now = Date.now();
        
        // Check if temp ban has expired
        if (banInfo.expiresAt && now > banInfo.expiresAt) {
          // Clean up expired ban
          await this.removeTempBan(wallet);
          return { isBanned: false, isTemporary: false };
        }

        return {
          isBanned: true,
          isTemporary: true,
          expiresAt: banInfo.expiresAt,
          reason: banInfo.reason,
        };
      }

      return { isBanned: false, isTemporary: false };
    } catch (error) {
      console.error('Failed to get ban status:', error);
      return { isBanned: false, isTemporary: false };
    }
  }

  async isUserBanned(wallet: string): Promise<boolean> {
    const status = await this.getBanStatus(wallet);
    return status.isBanned;
  }
}