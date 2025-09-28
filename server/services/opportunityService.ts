import { storage } from '../storage';
import { InsertOpportunity, Opportunity, InsertMatch } from '@shared/schema';

export class OpportunityService {
  async createOpportunity(userId: string, opportunityData: InsertOpportunity): Promise<Opportunity> {
    const opportunity = await storage.createOpportunity({
      ...opportunityData,
      postedById: userId
    });

    // Log opportunity creation
    await storage.createAuditLog({
      userId,
      action: 'opportunity_created',
      resourceType: 'opportunity',
      resourceId: opportunity.id,
      details: opportunityData
    });

    return opportunity;
  }

  async getOpportunities(limit?: number, offset?: number): Promise<Opportunity[]> {
    return await storage.getOpportunities(limit, offset);
  }

  async getOpportunity(id: string): Promise<Opportunity> {
    const opportunity = await storage.getOpportunity(id);
    if (!opportunity) {
      throw new Error('Opportunity not found');
    }
    return opportunity;
  }

  async searchOpportunities(query: string): Promise<Opportunity[]> {
    return await storage.searchOpportunities(query);
  }

  async getOpportunitiesByType(type: string): Promise<Opportunity[]> {
    return await storage.getOpportunitiesByType(type);
  }

  async matchUserToOpportunity(userId: string, opportunityId: string): Promise<any> {
    // Check if opportunity exists
    const opportunity = await storage.getOpportunity(opportunityId);
    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    // Check if user exists
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Create match
    const match = await storage.createMatch({
      userId,
      opportunityId,
      status: 'pending'
    });

    // Log match creation
    await storage.createAuditLog({
      userId,
      action: 'match_created',
      resourceType: 'match',
      resourceId: match.id,
      details: { opportunityId }
    });

    return match;
  }

  async getUserMatches(userId: string): Promise<any[]> {
    return await storage.getMatchesByUser(userId);
  }

  async updateMatchStatus(matchId: string, status: string, userId: string): Promise<any> {
    const match = await storage.updateMatchStatus(matchId, status);
    if (!match) {
      throw new Error('Match not found');
    }

    // Log match status update
    await storage.createAuditLog({
      userId,
      action: 'match_status_updated',
      resourceType: 'match',
      resourceId: matchId,
      details: { status }
    });

    return match;
  }
}

export const opportunityService = new OpportunityService();
