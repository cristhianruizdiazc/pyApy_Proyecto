import { SearchFilterState, MatchingResult } from '../types';
import { ApiClient } from './apiClient';

export class MatchingService {
  /**
   * Evaluates properties against user search filters using authoritative backend API & Cloud Firestore
   */
  static async searchProperties(
    filters: SearchFilterState
  ): Promise<{
    availableMatches: MatchingResult[];
    alternatives: MatchingResult[];
    unavailableMatches: MatchingResult[];
  }> {
    const res = await ApiClient.searchProperties(filters);
    if (res.data) {
      return res.data;
    }
    return {
      availableMatches: [],
      alternatives: [],
      unavailableMatches: []
    };
  }
}
