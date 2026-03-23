# Changelog

All notable changes to the Duden Raycast extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-23

### Added
- Initial release of Duden dictionary extension for Raycast
- Real-time German word search with minimum 3-character trigger
- Comprehensive word information display including:
  - Word title with article (e.g., "Löffel, der")
  - Part of speech classification
  - Frequency rating (1-5 stars)
  - Word separation/syllables
  - Detailed meanings and definitions
  - Synonyms
  - Usage context
  - Etymology/origin information
  - Pronunciation (IPA notation)
  - Alternative spellings
  - Usage examples
- Smart search behavior:
  - Auto-jump to details view for single results
  - Debounced search (300ms) for performance
  - Limited to 12 search results for optimal UX
- Copy actions for word, meaning, and pronunciation
- Direct links to open words on Duden.de
- In-memory caching (30-minute TTL) for improved performance
- Comprehensive error handling and user feedback

### Technical Details
- Built with TypeScript and React
- Uses Cheerio for HTML parsing
- Implements web scraping of duden.de with respectful caching
- Based on parsing patterns from the Python `duden` project

### Credits
- Inspired by and based on parsing techniques from the [Python duden project](https://github.com/radomirbosak/duden)
- Created by Radomir Bosak and contributors
- Web scraping patterns adapted from their comprehensive Duden.de parser