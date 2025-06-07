import RootLayout, { metadata } from './layout';

// Mock TRPCReactProvider to simplify testing
jest.mock('~/api/client', () => ({
  TRPCReactProvider: jest.fn(({ children }: { children: React.ReactNode }) => children),
}));

// Get the mocked function after the mock is set up
import { TRPCReactProvider } from '~/api/client';
const MockTRPCReactProvider = TRPCReactProvider as jest.MockedFunction<typeof TRPCReactProvider>;

// Mock Next.js fonts
jest.mock('next/font/google', () => ({
  Geist: jest.fn(() => ({
    variable: '--font-geist-sans',
    className: 'geist-sans',
  })),
  Geist_Mono: jest.fn(() => ({
    variable: '--font-geist-mono',
    className: 'geist-mono',
  })),
}));

// Get the mocked functions after the mock is set up
import { Geist, Geist_Mono } from 'next/font/google';
const mockGeist = Geist as jest.MockedFunction<typeof Geist>;
const mockGeistMono = Geist_Mono as jest.MockedFunction<typeof Geist_Mono>;

// Mock CSS import
jest.mock('./globals.css', () => ({}));

describe('RootLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Metadata', () => {
    it('exports correct metadata', () => {
      expect(metadata).toEqual({
        title: 'image AI',
        description: 'Image processing',
      });
    });
  });

  describe('Font Configuration', () => {
    it('imports and configures fonts correctly', () => {
      // Test that the fonts are imported and available
      expect(mockGeist).toBeDefined();
      expect(mockGeistMono).toBeDefined();

      // Test that the font configuration is applied in the component
      const testChild = <div>Test</div>;
      const layout = RootLayout({ children: testChild });
      const bodyElement = layout.props.children.props.children;

      // Check that font variables are applied
      expect(bodyElement.props.className).toContain('--font-geist-sans');
      expect(bodyElement.props.className).toContain('--font-geist-mono');
    });
  });

  describe('Component Structure', () => {
    it('creates proper HTML structure with correct attributes', () => {
      const testChild = <div>Test</div>;
      const layout = RootLayout({ children: testChild });

      // Check the html element props
      expect(layout.type).toBe('html');
      expect(layout.props.lang).toBe('en');

      // Check that TRPCReactProvider is the direct child
      const trpcProvider = layout.props.children;
      expect(trpcProvider.type).toBe(MockTRPCReactProvider);
    });

    it('applies correct CSS classes to body element', () => {
      const testChild = <div>Test</div>;
      const layout = RootLayout({ children: testChild });

      // Navigate to the body element in the structure
      const bodyElement = layout.props.children.props.children;

      expect(bodyElement.type).toBe('body');
      expect(bodyElement.props.className).toContain('--font-geist-sans');
      expect(bodyElement.props.className).toContain('--font-geist-mono');
      expect(bodyElement.props.className).toContain('antialiased');
    });

    it('passes children to the body element', () => {
      const testChild = <div data-testid="test-content">Test Content</div>;
      const layout = RootLayout({ children: testChild });

      // Navigate to the body element and check its children
      const bodyElement = layout.props.children.props.children;
      expect(bodyElement.props.children).toBe(testChild);
    });

    it('wraps content with TRPCReactProvider', () => {
      const testChild = <div>Test Content</div>;
      const layout = RootLayout({ children: testChild });

      // Check that TRPCReactProvider is used in the structure
      const trpcProvider = layout.props.children;
      expect(trpcProvider.type).toBe(MockTRPCReactProvider);

      // Check that the body element is passed as children to TRPCReactProvider
      const bodyElement = trpcProvider.props.children;
      expect(bodyElement.type).toBe('body');
      expect(bodyElement.props.children).toBe(testChild);
    });
  });

  describe('Integration', () => {
    it('creates a complete layout structure', () => {
      const testChild = <main>App Content</main>;
      const layout = RootLayout({ children: testChild });

      // Verify the complete structure: html > TRPCProvider > body > children
      expect(layout.type).toBe('html');
      expect(layout.props.lang).toBe('en');

      const trpcProvider = layout.props.children;
      expect(trpcProvider.type).toBe(MockTRPCReactProvider);

      const bodyElement = trpcProvider.props.children;
      expect(bodyElement.type).toBe('body');
      expect(bodyElement.props.children).toBe(testChild);
    });

    it('handles different types of children', () => {
      const stringChild = 'Text content';
      const layout1 = RootLayout({ children: stringChild });
      const bodyElement1 = layout1.props.children.props.children;
      expect(bodyElement1.props.children).toBe(stringChild);

      const elementChild = <div>Element content</div>;
      const layout2 = RootLayout({ children: elementChild });
      const bodyElement2 = layout2.props.children.props.children;
      expect(bodyElement2.props.children).toBe(elementChild);

      const fragmentChild = (
        <>
          <div>First</div>
          <div>Second</div>
        </>
      );
      const layout3 = RootLayout({ children: fragmentChild });
      const bodyElement3 = layout3.props.children.props.children;
      expect(bodyElement3.props.children).toBe(fragmentChild);
    });
  });

  describe('Accessibility and SEO', () => {
    it('sets proper language attribute for screen readers', () => {
      const testChild = <div>Test</div>;
      const layout = RootLayout({ children: testChild });

      expect(layout.props.lang).toBe('en');
    });

    it('applies antialiased class for better text rendering', () => {
      const testChild = <div>Test</div>;
      const layout = RootLayout({ children: testChild });

      const bodyElement = layout.props.children.props.children;
      expect(bodyElement.props.className).toContain('antialiased');
    });

    it('includes font variables for proper typography', () => {
      const testChild = <div>Test</div>;
      const layout = RootLayout({ children: testChild });

      const bodyElement = layout.props.children.props.children;
      expect(bodyElement.props.className).toContain('--font-geist-sans');
      expect(bodyElement.props.className).toContain('--font-geist-mono');
    });
  });
});
