import { getPreferenceValues, List } from '@raycast/api';
import { useCallback, useEffect, useState } from 'react';
import fetch from 'node-fetch';

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

export default function Command() {
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [items, setItems] = useState<Card[]>([]);

  const search = useCallback(async () => {
    if (searchText.length < 3) {
      return;
    }

    setLoading(true);
    const url = `https://${preferences.appId}-dsn.algolia.net/1/indexes/${preferences.target}?query=${searchText}`;

    const res = await fetch(url, {
      headers: {
        "X-Algolia-API-Key": preferences.apiKey,
        "X-Algolia-Application-Id": preferences.appId,
      },
    });

   const json = await res.json() as any;

    const items = json.hits.map((h: any) => {
      const cardLink = `https://${preferences.host}/board/${h.boardId}#${h.objectID}`;
      return ({
        id: h.objectID,
        title: h.title,
        mdStr: h.mdStr,
        url: cardLink,
      });
    });

    setItems(items);
    setLoading(false);
  }, [searchText]);

  useEffect(() => {
    void search();
  }, [searchText]);


  return (
    <List isShowingDetail onSearchTextChange={setSearchText} isLoading={loading}>
      {items.map((item) => (
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
