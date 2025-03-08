[English](https://github.com/QL-boy/ProxyEnhance/blob/main/README_EN.md)
# Proxy Enhance
![image](/image/中文.png)

Proxy Enhance 是一款 Obsidian 插件，版本为 1.0.0，最低支持 Obsidian 应用版本 0.15.0。该插件专为桌面端设计，旨在为 Obsidian 提供内置的网络代理支持，帮助用户轻松配置网络代理，并在整个 Obsidian 应用中使用这些代理。当前支持的代理类型包括 socks、http 和 https，适用于网络受限地区的用户。你可以通过 [Github 仓库](https://github.com/QL-boy) 获取该插件，若你觉得此插件有帮助，也可以通过 [捐赠链接](https://buymeacoffee.com/lragonstarr) 支持开发者。

## 功能特性
1. **多种代理类型支持**：支持 socks、http 和 https 代理，满足不同用户的网络需求。
2. **智能代理选择**：如果同时设置了 socks 和 http/https 代理，插件会优先使用 socks 代理，若失败则尝试 http/https 代理，若仍失败则直接进行请求。
3. **插件令牌支持**：对于一些维护自己网络连接而不使用 Obsidian 默认会话的插件，用户可以通过声明插件令牌来代理其网络流量。
4. **黑名单功能**：用户可以设置黑名单，指定哪些 URL 不使用代理，绕过列表是一个逗号分隔的规则列表。
5. **PAC 模式配置**：支持 PAC（Proxy Auto-Configuration）模式，包括订阅 PAC 文件和手动设置本地 PAC 规则。
6. **语言切换**：支持英语和中文两种语言，方便不同地区的用户使用。
7. **代理连接测试**：提供代理连接测试功能，用户可以输入测试 URL 并点击按钮测试代理是否正常工作。

## 安装方法
将插件文件复制到 Obsidian 的插件目录下，然后在 Obsidian 的设置中启用该插件。

## 使用方法
### 基本代理设置
1. **启用代理**：在插件设置中，切换“启用代理”开关来开启或关闭代理功能。
2. **选择代理模式**：支持“基础模式”和“高级模式”。
    - **基础模式**：只需填写一个基础代理地址，格式为 `<scheme>://<host>:<port>`，例如 `http://127.0.0.1:10809`。
    - **高级模式**：分别设置 HTTP、HTTPS 和 SOCKS 代理地址。
3. **PAC 模式配置**：可以选择“禁用”、“白名单”或“黑名单”模式。
    - **订阅模式**：输入 PAC 文件的 URL。
    - **手动模式**：输入本地 PAC 规则。
4. **绕过规则设置**：如果需要设置不使用代理的 URL，可以启用“绕过已启用”开关，并输入绕过规则。

### 插件令牌设置
一些插件会维护自己的网络连接，不使用 Obsidian 的默认会话，因此它们的流量不会被代理。用户可以通过设置插件令牌来代理这些插件的网络流量。以下是一些流行 Obsidian 插件的插件令牌示例：
| 仓库 | 插件令牌 |
|---|---|
| [Obsidian-Surfing](https://github.com/PKM-er/Obsidian-Surfing) | `persist:surfing-vault-${appId}` |
| [media-extended](https://github.com/PKM-er/media-extended) | `persist:mx-player-${appId}` |

### 黑名单规则
绕过列表是一个逗号分隔的规则列表，规则如下：
- `[ URL_SCHEME "://" ] HOSTNAME_PATTERN [ ":" <port> ]`：匹配所有符合 `HOSTNAME_PATTERN` 模式的主机名。例如：`foobar.com`、`*foobar.com`、`*.foobar.com`、`*foobar.com:99`、`https://x.*.y.com:99`。
- `"." HOSTNAME_SUFFIX_PATTERN [ ":" PORT ]`：匹配特定的域名后缀。例如：`.google.com`、`.com`、`http://.google.com`。
- `[ SCHEME "://" ] IP_LITERAL [ ":" PORT ]`：匹配 IP 地址字面量的 URL。例如：`127.0.1`、`[0:0::1]`、`[::1]`、`http://[::1]:99`。
- `IP_LITERAL "/" PREFIX_LENGTH_IN_BITS`：匹配落在给定范围内的 IP 地址字面量的任何 URL。IP 范围使用 CIDR 表示法指定。例如：`192.168.1.1/16`、`fefe:13::abc/33`。
- `<local>`：匹配本地地址。`<local>` 的含义是主机是否匹配以下之一：`127.0.0.1`、`::1`、`localhost`。

### 代理连接测试
在插件设置中，输入测试 URL（例如 `https://www.google.com`），然后点击“立即测试”按钮，插件会尝试通过代理访问该 URL，并显示测试结果。

## 语言切换
在插件设置中，选择“语言”选项，可以切换插件界面的语言，支持英语和中文。

## 注意事项
- 如果所有代理地址都无效，所有请求将直接进行，不使用代理。
- 部分插件可能不支持代理，需要通过设置插件令牌来解决。
