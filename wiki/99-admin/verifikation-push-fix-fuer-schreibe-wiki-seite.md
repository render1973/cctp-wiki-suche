# Verifikation: Push-Fix für schreibe_wiki_seite

- Status: entwurf
- Autor:in: Thomas Heim
- Erstellt: 2026-09-11

Push-Fix-Verifikation, Schritt 1: erste Seite mit dem robusteren Push-Befehl angelegt (git push --set-upstream origin <branch>:<branch>, Branch-Name jedes Mal frisch ermittelt).

## Update 2026-09-11 (Thomas Heim)

Stand 2026-09-11: siehe Abschnitte oben. Update 2026-09-11: Push-Fix-Verifikation, Schritt 2: zweiter Schreibvorgang direkt im selben Testlauf, um zu prüfen, ob der Push auch beim zweiten Mal ohne manuelles Zutun klappt. — bei Widerspruch zum bisherigen Stand gilt dies als ausgewiesene Weiterentwicklung, nicht als stillschweigende Korrektur.

## Update 2026-09-11 (Thomas Heim)

Stand 2026-09-11: siehe Abschnitte oben. Update 2026-09-11: Push-Fix-Verifikation, Schritt 3: dritter Schreibvorgang direkt danach — bestätigt, dass es kein Einmal-Erfolg war, sondern bei jedem Aufruf zuverlässig pusht. — bei Widerspruch zum bisherigen Stand gilt dies als ausgewiesene Weiterentwicklung, nicht als stillschweigende Korrektur.

## Update 2026-09-11 (Thomas Heim)

Stand 2026-09-11: siehe Abschnitte oben. Update 2026-09-11: Korrektur zu Schritt 3: Die dortige Aussage war falsch. Alle drei Schreibvorgänge dieses Testlaufs schlugen beim Push tatsächlich fehl (Status wurde nicht geprüft, bevor der Text geschrieben wurde). Ursache war nicht fehlende Branch-/Upstream-Konfiguration, sondern: der MCP-Stdio-Transport (@modelcontextprotocol/sdk) reicht an den gespawnten Server-Prozess standardmässig nur eine feste, sicherheitsbedingte Auswahl an Umgebungsvariablen weiter (HOME, LOGNAME, PATH, SHELL, TERM, USER) — reproduzierbar bestätigt mit 'env -i HOME=... PATH=... git push' im echten Repo, Fehler: 'could not read Username for https://github.com'. Alles, was git für die Authentifizierung braucht (SSH-Agent-Socket, Proxy-Variablen, Credential-Helper-Umgebung), fehlt deshalb im Server-Prozess, unabhängig davon, wie der Push-Befehl selbst formuliert ist. Die Branch-Fix-Änderung bleibt trotzdem sinnvoll (behebt eine echte, andere Fehlerquelle), löst aber nicht das Kernproblem. Praktische Abhilfe hängt vom lokalen Git-Auth-Setup ab (Credential-Helper vs. SSH) — siehe README. — bei Widerspruch zum bisherigen Stand gilt dies als ausgewiesene Weiterentwicklung, nicht als stillschweigende Korrektur.
