import { Action, ActionPanel, Detail, getPreferenceValues, Icon, List } from "@raycast/api";
import { useState } from "react";
import fetch from "node-fetch";
import useSWR from "swr";
import { z } from "zod";

const cardScheme = z.object({
  boardId: z.string(),
  color: z.string(),
  createdAt: z.number(),
  mdStr: z.string(),
  objectID: z.string(),
  title: z.string(),
  updatedAt: z.number(),
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
    <List
      searchBarPlaceholder="you should enter over 3 letters."
      isShowingDetail
      onSearchTextChange={setSearchText}
      isLoading={data === undefined}
    >
      {data !== undefined &&
        data.map((card) => {
          return (
            <List.Item
              key={card.objectID}
              icon={{
                source: Icon.Document,
                tintColor: card.color,
              }}
              title={card.title}
              detail={<List.Item.Detail markdown={card.mdStr} />}
              actions={
                <ActionPanel title="#1 in raycast/extensions">
                  <Action.Push title="Show Detail" target={<CardDetail card={card} />} />
                  <Action.OpenInBrowser url={`https://${preferences.host}/board/${card.boardId}#${card.objectID}`} />
                </ActionPanel>
              }
            />
          );
        })}
    </List>
  );
}

const formatDate = (date: Date, format: string): string => {
  return format
    .replace(/yyyy/g, `${date.getFullYear()}`)
    .replace(/MM/g, `0${date.getMonth() + 1}`.slice(-2))
    .replace(/dd/g, `0${date.getDate()}`.slice(-2))
    .replace(/HH/g, `0${date.getHours()}`.slice(-2))
    .replace(/mm/g, `0${date.getMinutes()}`.slice(-2))
    .replace(/ss/g, `0${date.getSeconds()}`.slice(-2))
    .replace(/SSS/g, `00${date.getMilliseconds()}`.slice(-3));
};

function CardDetail({ card }: { card: Card }) {
  return (
    <Detail
      markdown={card.mdStr}
      navigationTitle={card.title}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Link
            title="Board Link"
            target={`https://${preferences.host}/board/${card.boardId}`}
            text={`https://${preferences.host}/board/${card.boardId}`}
          />
          <Detail.Metadata.Link
            title="Card Link"
            target={`https://${preferences.host}/board/${card.boardId}#${card.objectID}`}
            text={`https://${preferences.host}/board/${card.boardId}#${card.objectID}`}
          />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Created At" text={formatDate(new Date(card.createdAt), "yyyy-MM-dd HH:mm")} />
          <Detail.Metadata.Label title="Updated At" text={formatDate(new Date(card.updatedAt), "yyyy-MM-dd HH:mm")} />
        </Detail.Metadata>
      }
    />
  );
}
