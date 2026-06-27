const { calculateRrfScore, fuseRankings } = require('./rrfMath');

describe('Reciprocal Rank Fusion (RRF) Logic', () => {
  describe('calculateRrfScore', () => {
    it('should calculate the correct score for rank 1 with default k=60', () => {
      const score = calculateRrfScore(1);
      expect(score).toBeCloseTo(1 / 61); // ~0.01639
    });

    it('should calculate the correct score for rank 10 with k=60', () => {
      const score = calculateRrfScore(10);
      expect(score).toBeCloseTo(1 / 70); // ~0.01428
    });

    it('should return 0 for invalid ranks (<= 0)', () => {
      expect(calculateRrfScore(0)).toBe(0);
      expect(calculateRrfScore(-5)).toBe(0);
    });

    it('should allow custom k values', () => {
      const score = calculateRrfScore(1, 10);
      expect(score).toBeCloseTo(1 / 11);
    });
  });

  describe('fuseRankings', () => {
    it('should rank an item higher if it appears in both lists', () => {
      const vectorRankings = [
        { id: 'chunk-A', rank: 1 },
        { id: 'chunk-B', rank: 2 }
      ];
      const keywordRankings = [
        { id: 'chunk-C', rank: 1 },
        { id: 'chunk-A', rank: 2 } // chunk-A appears in both
      ];

      const fused = fuseRankings(vectorRankings, keywordRankings);
      
      // chunk-A has (1/61) + (1/62) = ~0.0325
      // chunk-B has (1/62) = ~0.0161
      // chunk-C has (1/61) = ~0.0163
      // Expected order: chunk-A, chunk-C, chunk-B
      expect(fused[0].id).toBe('chunk-A');
      expect(fused[1].id).toBe('chunk-C');
      expect(fused[2].id).toBe('chunk-B');
    });

    it('should handle items appearing in only one list', () => {
      const vectorRankings = [{ id: 'chunk-A', rank: 1 }];
      const keywordRankings = [{ id: 'chunk-B', rank: 1 }];

      const fused = fuseRankings(vectorRankings, keywordRankings);
      
      expect(fused.length).toBe(2);
      expect(fused[0].rrf_score).toEqual(fused[1].rrf_score); // Both have rank 1
    });

    it('should handle empty input arrays gracefully', () => {
      const fused = fuseRankings([], []);
      expect(fused).toEqual([]);
    });
  });
});
