import { Action, ActionPanel, Detail, getPreferenceValues, Icon, List } from "@raycast/api";
import { useState } from "react";
import fetch from "node-fetch";
import useSWR from "swr";
import { z } from "zod";

const cardScheme = z.object({
  objectID: z.string(),
  boardId: z.string(),
  title: z.string(),
  mdStr: z.string(),
});

type Card = z.infer<typeof cardScheme>;

const searchResultScheme = z.object({
  hits: z.array(cardScheme),
});

type Preferences = {
  appId: string;
  apiKey: string;
  target: string;
  host: string;
};

const preferences = getPreferenceValues<Preferences>();

const fetcher = async (url: string, searchText: string): Promise<Card[] | undefined> => {
  if (searchText.length < 3) {
    return undefined;
  }

  const res = await fetch(url, {
    headers: {
      "X-Algolia-API-Key": preferences.apiKey,
      "X-Algolia-Application-Id": preferences.appId,
    },
  });

  const json = (await res.json()) as unknown;

  const result = searchResultScheme.parse(json);

  return result.hits;
};

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const { data, error } = useSWR(
    `https://${preferences.appId}-dsn.algolia.net/1/indexes/${preferences.target}?query=${searchText}`,
    (url) => fetcher(url, searchText)
  );

  if (error !== undefined) {
    return <Detail markdown={`Sorry. An error occurred. \n>${error.message}`} />;
  }

  return (
    <List isShowingDetail onSearchTextChange={setSearchText} isLoading={data === undefined}>
      {data !== undefined &&
        data.map((card) => {
          return (
            <List.Item
              key={card.objectID}
              icon={Icon.Document}
              title={card.title}
              detail={<List.Item.Detail markdown={card.mdStr} />}
              actions={
                <ActionPanel title="#1 in raycast/extensions">
                  <Action.OpenInBrowser url={`https://${preferences.host}/board/${card.boardId}#${card.objectID}`} />
                </ActionPanel>
              }
            />
          );
        })}
    </List>
  );
}
