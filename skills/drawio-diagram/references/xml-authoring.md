# draw.io XML最小リファレンス

draw.io XMLを直接作成・修正するときに読む。フロー・シーケンスも`.drawio`を正本にする（下書きとして一時的なMermaidからCLI変換を経てもよいが、`.mmd`は残さない）。

## 最小構造

```xml
<mxfile host="Electron" version="29.0.3">
  <diagram id="page-1" name="Page-1">
    <mxGraphModel dx="1280" dy="720" grid="1" gridSize="10" page="1" pageScale="1" pageWidth="1280" pageHeight="720">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="node-a" value="入力" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
          <mxGeometry x="80" y="180" width="180" height="72" as="geometry" />
        </mxCell>
        <mxCell id="node-b" value="処理" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
          <mxGeometry x="420" y="180" width="180" height="72" as="geometry" />
        </mxCell>
        <mxCell id="edge-a-b" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;" edge="1" parent="1" source="node-a" target="node-b">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

## 必須ルール

- `0`と`1`はroot用に予約し、他のセルで再利用しない
- すべての`id`を一意にする
- ノードは`vertex="1"`、接続線は`edge="1"`を持つ
- edgeには`source`、`target`と`<mxGeometry relative="1" as="geometry" />`を置く
- ラベル内の`&`、`<`、`>`、引用符をXMLエスケープする
- グループ内ノードの`parent`はグループセルを指し、座標は親からの相対位置として扱う
- 接続線が図形を横切る場合は、ノード間隔を広げてからwaypointを検討する

## 安全な編集

- 色・文言・位置の修正は該当する`mxCell`だけを変更する
- ノード削除時は、そのidを`source`または`target`に持つedgeも削除する
- 全体方向を変える場合は局所修正を重ねず、図全体を再配置する
- XML編集後はDesktop CLIでSVGへ書き出し、パース可能性と見た目を同時に確認する

より高度なシェイプ、入れ子、レイヤー、ルーティングが必要な場合はdraw.io公式リファレンスを確認する:
https://github.com/jgraph/drawio-mcp/blob/main/shared/xml-reference.md
