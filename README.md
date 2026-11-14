# DWËLL Resgate GGD2™ — v0.3.0

Portal de recuperação pelo navegador, independente do Mac, SSD e painel local de backups.

## Endereços
- Control Center / GoDaddy: https://dwell.music/whatsapp-webhook/monitor/resgate-ggd2
- Cópia independente: https://dwelllabs.github.io/dwell-ggd2-resgate/
- Versões: https://github.com/DwellLabs/dwell-ggd2-resgate/releases

## Uso
Na GoDaddy, o login do Control Center continua obrigatório. Em seguida, conecte a conta Google da DWËLL. No GitHub Pages, conecte diretamente a conta Google. A navegação lista o conteúdo efetivamente copiado para appDataFolder. Abra uma pasta e use Baixar. Para arquivos grandes, Chrome ou Edge permite gravação em fluxo no destino escolhido.

Conferir leitura (até 8 MiB) obtém bytes reais, confere tamanho e SHA-256 quando o Drive fornece o hash. O resultado explica quando apenas foi calculado um hash sem comparação remota. Não certifica a execução funcional de aplicações nem o término da cópia completa.

## Segurança
A interface implementa somente GET: lista, metadados e download. Não há exclusão, renomeação, gravação ou sincronização. OAuth usa drive.appdata e userinfo.email. **drive.appdata não é um escopo somente leitura**; a restrição de operações está implementada no código. O token fica apenas na memória da aba, nunca em cookie, localStorage, servidor GoDaddy ou GitHub. Encerrar acesso limpa a memória sem revogar o consentimento do projeto Google e sem interromper o backup.

O repositório é público apenas para servir a interface. Não contém acervo CRIATIVO/ALTAR, backups, tokens, chave privada, segredo OAuth ou senha. Client ID OAuth é identificador público e não autentica acesso aos dados por si só.

## Independência e limites
A edição GoDaddy não depende do Mac nem do painel local. A edição GitHub não depende da GoDaddy. Ambas dependem da conta Google e do projeto OAuth já cadastrado. Não exclua o projeto OAuth nem os dados ocultos do aplicativo no Google Drive. GGD1 e GGD2 usam a mesma conta, portanto não oferecem independência contra perda total dessa conta.

## Versões e implantação
Assets são versionados em assets/; o histórico Git conserva V001. Tag v0.3.0 identifica V002. O diretório integration contém o módulo aditivo e o template do Control Center. A implantação exige backup e comparação de hashes dos arquivos existentes, sem substituir o banco de sessões. As origens OAuth são https://dwell.music e https://dwelllabs.github.io. A política de conteúdo Google é aplicada somente à rota de recuperação, sem ampliar a CSP de outros módulos.

## Recuperação da interface
Este repositório possui todos os assets próprios e os assets visuais necessários. Publicar main na raiz do GitHub Pages restaura a edição independente. Para outro domínio, cadastrar sua origem no cliente OAuth e manter o mesmo projeto Google que possui appDataFolder. Nenhum token do Mac precisa ser copiado.

## V003 · árvore e tamanho confiável
A árvore de pastas carrega níveis sob demanda e mantém a navegação por caminho.
O indicador de tamanho conta arquivos diretos: caso só existam subpastas, informa
"Não calculado", nunca 0 B. A leitura não faz soma recursiva nem altera dados.
A implantação do Control Center é independente e requer troca aditiva dos assets e
do módulo autenticado; preservar V002 para rollback.
