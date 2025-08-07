let news = [];

try {
  const newsRes = await axios.get('https://newsapi.org/v2/everything', {
    params: {
      q: ticker,
      sortBy: 'publishedAt',
      language: 'en',
      apiKey: NEWS_API_KEY,
      pageSize: 5
    }
  });

  news = newsRes.data.articles.map(article => ({
    title: article.title,
    description: article.description,
    url: article.url
  }));
} catch (newsError) {
  console.error('News API error:', newsError.message);
  news = [
    {
      title: `No live news available for ${ticker}`,
      description: 'Default fallback used due to news API error.',
      url: ''
    }
  ];
}
