import { getPreferenceValues, Detail, List } from '@raycast/api';
import { useState } from 'react';
import fetch from 'node-fetch';
import useSWR from 'swr';

type Preferences = {
  appId: string;
  apiKey: string;
  target: string;
  host: string;
};

type Card = {
  id: string,
  title: string,
  mdStr: string,
  url: string,
}


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

  const json = await res.json() as any;

  return json.hits.map((h: any) => {
    const cardLink = `https://${preferences.host}/board/${h.boardId}#${h.objectID}`;
    return ({
      id: h.objectID,
      title: h.title,
      mdStr: h.mdStr,
      url: cardLink,
    });
  });
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const { data, error } = useSWR( `https://${preferences.appId}-dsn.algolia.net/1/indexes/${preferences.target}?query=${searchText}`, url => fetcher(url, searchText));

  if (error !== undefined) {
    return <Detail markdown="Sorry. An error occurred." />;
  }

  return (
    <List isShowingDetail onSearchTextChange={setSearchText} isLoading={data === undefined}>
      {data !== undefined && data.map((item) => (
        <List.Item
          key={item.id}
          icon="list-icon.png"
          title={item.title}
          detail={ <List.Item.Detail markdown={item.mdStr} /> }
        />
      ))}
    </List>
  );
}
