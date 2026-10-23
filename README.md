# TurkeyTuna

Stemapparaat voor gitaar, bas, ukelele, strijkinstrumenten, banjo, mandoline en meer, als web-app die je op je telefoon kunt installeren (PWA).

- Chromatische stemmer en stemmer per snaar (automatisch of met een vaste snaar)
- Veel instrumenten met hun gangbare en alternatieve stemmingen
- Referentietonen per snaar
- Instelbare A4 (415–466 Hz)
- Werkt offline; microfoonaudio verlaat het apparaat niet

## Ontwikkelen

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build    # naar dist/
```

Microfoontoegang werkt alleen op `localhost` of via HTTPS. Om op je telefoon te testen heb je dus een HTTPS-adres nodig, bijvoorbeeld via Tailscale Serve.
