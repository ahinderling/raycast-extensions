/**
 * Main search command for Duden.de word lookup
 */

import { useState, useEffect } from "react";
import { List, ActionPanel, Action, Icon, showToast, Toast } from "@raycast/api";
import { searchAndGetDetails, getWordDetails } from "./api/duden";
import { SearchResult, DudenWord } from "./types/duden";
import WordDetails from "./components/WordDetails";

export default function SearchDuden() {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWord, setSelectedWord] = useState<DudenWord | null>(null);

  // Handle search with debouncing and minimum character requirement
  useEffect(() => {
    if (searchText.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);

    const searchTimeout = setTimeout(async () => {
      try {
        const { results, singleWord } = await searchAndGetDetails(searchText);

        setSearchResults(results);

        // If single result, show details immediately as discussed
        if (singleWord) {
          setSelectedWord(singleWord);
        } else {
          setSelectedWord(null);
        }
      } catch (error) {
        console.error("Search failed:", error);
        await showToast({
          style: Toast.Style.Failure,
          title: "Search failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
        setSearchResults([]);
        setSelectedWord(null);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(searchTimeout);
  }, [searchText]);

  // Handle word selection from search results
  const handleWordSelection = async (result: SearchResult) => {
    setIsLoading(true);
    try {
      const word = await getWordDetails(result.urlname);
      setSelectedWord(word);
    } catch (error) {
      console.error("Failed to load word details:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to load word details",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If we have a selected word, show details
  if (selectedWord) {
    return <WordDetails word={selectedWord} />;
  }

  // Otherwise show search interface
  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search German words on Duden.de (minimum 3 characters)..."
      throttle
    >
      {searchText.length < 3 ? (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="Start typing to search"
          description="Enter at least 3 characters to search for German words"
        />
      ) : searchResults.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="No results found"
          description={`No words found for "${searchText}"`}
        />
      ) : (
        searchResults.map((result, index) => (
          <List.Item
            key={`${result.urlname}-${index}`}
            title={result.name}
            subtitle={result.partOfSpeech}
            icon={Icon.Document}
            actions={
              <ActionPanel>
                <Action title="View Details" icon={Icon.Eye} onAction={() => handleWordSelection(result)} />
                <Action.CopyToClipboard
                  title="Copy Word"
                  content={result.name}
                  icon={Icon.Clipboard}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
                <Action.OpenInBrowser
                  title="Open in Duden.de"
                  url={`https://www.duden.de/rechtschreibung/${result.urlname}`}
                  icon={Icon.Globe}
                  shortcut={{ modifiers: ["cmd"], key: "o" }}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
