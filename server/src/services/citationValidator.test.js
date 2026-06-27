const { extractFilePaths, validateCitations } = require('./citationValidator');

describe('Citation Validator Service', () => {
  describe('extractFilePaths', () => {
    it('should extract valid file paths with slashes and extensions', () => {
      const text = 'As you can see in src/utils/math.js, the logic is sound.';
      const paths = extractFilePaths(text);
      expect(paths).toContain('src/utils/math.js');
    });

    it('should filter out false positives without slashes', () => {
      const text = 'This is a sentence.end. Let us look at backend/server.ts.';
      const paths = extractFilePaths(text);
      expect(paths).not.toContain('sentence.end');
      expect(paths).toContain('backend/server.ts');
    });

    it('should handle empty or path-less strings gracefully', () => {
      const paths = extractFilePaths('There are no paths here.');
      expect(paths).toEqual([]);
    });
  });

  describe('validateCitations', () => {
    const mockChunks = [
      { file_path: 'src/app.js' },
      { file_path: 'backend/services/auth.ts' }
    ];

    it('should return empty array if no hallucinations exist', () => {
      const text = 'The code is in src/app.js and uses auth.ts.';
      const hallucinations = validateCitations(text, mockChunks);
      expect(hallucinations).toEqual([]); // "auth.ts" doesn't have a slash so it might not be extracted, but src/app.js is valid
    });

    it('should return hallucinated paths that are not in chunks', () => {
      const text = 'Look at src/app.js and also src/fake/fakeFile.js.';
      const hallucinations = validateCitations(text, mockChunks);
      expect(hallucinations).toContain('src/fake/fakeFile.js');
      expect(hallucinations).not.toContain('src/app.js');
    });

    it('should handle partial path matches (e.g., citing just backend/services/auth.ts when chunk is identical)', () => {
      const text = 'The logic resides in backend/services/auth.ts.';
      const hallucinations = validateCitations(text, mockChunks);
      expect(hallucinations).toEqual([]);
    });
  });
});
