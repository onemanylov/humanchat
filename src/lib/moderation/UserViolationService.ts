import type { EnvLike } from '../../../party/utils/env';
import { redisGET, redisSET } from '../../../party/utils/redis';
import type { UserViolation, ViolationAction } from './types';
import { MODERATION_CONFIG } from './config';

export class UserViolationService {
  private source: EnvLike;

  constructor(source: EnvLike) {
    this.source = source;
  }

  private getUserViolationKey(wallet: string): string {
    return `user:violations:${wallet}`;
  }

  async getUserViolations(wallet: string): Promise<UserViolation> {
    try {
      const key = this.getUserViolationKey(wallet);
      const data = await redisGET(this.source, key);
      
      if (!data) {
        return {
          warnings: 0,
          tempBans: 0,
          permBanned: false,
        };
      }

      return JSON.parse(data) as UserViolation;
    } catch (error) {
      console.error('Failed to get user violations:', error);
      return {
        warnings: 0,
        tempBans: 0,
        permBanned: false,
      };
    }
  }

  async recordViolation(wallet: string, reason: string): Promise<ViolationAction> {
    try {
      const violations = await this.getUserViolations(wallet);
      
      // If already permanently banned, no action needed
      if (violations.permBanned) {
        return 'permBan';
      }

      let action: ViolationAction;
      const updatedViolations: UserViolation = {
        ...violations,
        lastViolation: Date.now(),
      };

      // Determine action based on violation history
      if (violations.warnings >= MODERATION_CONFIG.MAX_WARNINGS_BEFORE_TEMP_BAN && 
          violations.tempBans >= MODERATION_CONFIG.MAX_TEMP_BANS_BEFORE_PERM_BAN) {
        // Permanent ban
        updatedViolations.permBanned = true;
        action = 'permBan';
      } else if (violations.warnings >= MODERATION_CONFIG.MAX_WARNINGS_BEFORE_TEMP_BAN) {
        // Temporary ban
        updatedViolations.tempBans += 1;
        action = 'tempBan';
      } else {
        // Warning
        updatedViolations.warnings += 1;
        action = 'warning';
      }

      // Save updated violations
      const key = this.getUserViolationKey(wallet);
      await redisSET(this.source, key, JSON.stringify(updatedViolations));

      return action;
    } catch (error) {
      console.error('Failed to record violation:', error);
      // Default to warning on error
      return 'warning';
    }
  }

  async isUserBanned(wallet: string): Promise<boolean> {
    try {
      const violations = await this.getUserViolations(wallet);
      return violations.permBanned;
    } catch (error) {
      console.error('Failed to check if user is banned:', error);
      return false;
    }
  }
}