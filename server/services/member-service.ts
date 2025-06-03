// ABOUTME: Service for managing TTL members in Airtable database
// ABOUTME: Handles member lookup, creation, and vote history retrieval

import Airtable from 'airtable';

export interface Member {
  id: string;
  phone: string;
  fullName?: string;
  email?: string;
  subscriptionProduct?: string[];
  createdAt?: string;
}

export interface MemberVote {
  gameId: number;
  voteType: string;
  votedAt: string;
}

export class MemberService {
  private airtable: any;
  
  constructor() {
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
      throw new Error('Airtable credentials not configured');
    }
    
    this.airtable = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE_ID);
  }
  
  // Find a member by phone number
  async findMemberByPhone(phone: string): Promise<Member | null> {
    try {
      const members = await this.airtable('Members')
        .select({
          filterByFormula: `{Phone} = '${phone}'`,
          maxRecords: 1
        })
        .firstPage();
      
      if (members.length === 0) {
        return null;
      }
      
      const record = members[0];
      return {
        id: record.id,
        phone: record.get('Phone'),
        fullName: record.get('Full Name') || undefined,
        email: record.get('Email') || undefined,
        subscriptionProduct: record.get('subscription_product') || undefined,
        createdAt: record.get('Created') || undefined
      };
    } catch (error) {
      console.error('Error finding member by phone:', error);
      throw new Error('Failed to find member');
    }
  }
  
  // Find or create a member by phone number
  async findOrCreateMember(phone: string, initialData?: { fullName?: string; email?: string }): Promise<Member> {
    try {
      // First try to find existing member
      const existingMember = await this.findMemberByPhone(phone);
      if (existingMember) {
        return existingMember;
      }
      
      // Create new member if not found
      const createData: any = {
        Phone: phone,
        'Full Name': initialData?.fullName || 'New Member',
        'subscription_product': ['Standard']
      };
      
      if (initialData?.email) {
        createData.Email = initialData.email;
      }
      
      const newRecord = await this.airtable('Members').create(createData);
      
      return {
        id: newRecord.id,
        phone: newRecord.get('Phone'),
        fullName: newRecord.get('Full Name'),
        email: newRecord.get('Email') || undefined,
        subscriptionProduct: newRecord.get('subscription_product'),
        createdAt: newRecord.get('Created')
      };
    } catch (error) {
      console.error('Error creating member:', error);
      throw new Error('Failed to create member');
    }
  }
  
  // Update member information
  async updateMember(memberId: string, updates: { fullName?: string; email?: string }): Promise<Member> {
    try {
      const updateData: any = {};
      
      if (updates.fullName) {
        updateData['Full Name'] = updates.fullName;
      }
      
      if (updates.email) {
        updateData.Email = updates.email;
      }
      
      const updatedRecord = await this.airtable('Members').update(memberId, updateData);
      
      return {
        id: updatedRecord.id,
        phone: updatedRecord.get('Phone'),
        fullName: updatedRecord.get('Full Name'),
        email: updatedRecord.get('Email') || undefined,
        subscriptionProduct: updatedRecord.get('subscription_product'),
        createdAt: updatedRecord.get('Created')
      };
    } catch (error) {
      console.error('Error updating member:', error);
      throw new Error('Failed to update member');
    }
  }
  
  // Get member's votes
  async getMemberVotes(memberId: string): Promise<MemberVote[]> {
    try {
      const votes = await this.airtable('Votes')
        .select({
          filterByFormula: `{Member} = '${memberId}'`,
          sort: [{ field: 'Created', direction: 'desc' }]
        })
        .all();
      
      return votes.map((vote: any) => ({
        gameId: vote.get('Game ID') || 0,
        voteType: vote.get('Vote Type') || 'unknown',
        votedAt: vote.get('Created') || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching member votes:', error);
      throw new Error('Failed to fetch member votes');
    }
  }
  
  // Create a vote for a member
  async createVote(memberId: string, gameId: number, voteType: string): Promise<void> {
    try {
      await this.airtable('Votes').create({
        Member: [memberId], // Airtable link field expects an array
        'Game ID': gameId,
        'Vote Type': voteType
      });
    } catch (error) {
      console.error('Error creating vote:', error);
      throw new Error('Failed to create vote');
    }
  }
  
  // Check if member exists by ID
  async memberExists(memberId: string): Promise<boolean> {
    try {
      const record = await this.airtable('Members').find(memberId);
      return !!record;
    } catch (error) {
      return false;
    }
  }
} 