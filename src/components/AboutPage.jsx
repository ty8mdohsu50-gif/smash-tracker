import { useI18n } from "../i18n/index.jsx";

export default function AboutPage({ T, onClose, onOpenLegal }) {
  const { t } = useI18n();

  const section = (title, children) => (
    <div
      style={{
        marginBottom: 20,
        padding: "16px 18px",
        background: T.inp,
        borderRadius: 12,
        border: `1px solid ${T.brd}`,
      }}
    >
      {title && (
        <div style={{ fontSize: 14, fontWeight: 700, color: T.accent, marginBottom: 10 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );

  const text = (content) => (
    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.8 }}>{content}</div>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,.55)", zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px", animation: "fadeIn .15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card, borderRadius: 16, width: "100%", maxWidth: 640,
          maxHeight: "88vh", display: "flex", flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,.35)", animation: "fadeUp .2s ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.brd}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src="/icon.png" alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "contain" }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>SMASH TRACKER</div>
                <div style={{ fontSize: 11, color: T.dim }}>v1.0.0</div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.brd}`,
                background: T.inp, color: T.sub, fontSize: 18, lineHeight: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              x
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px 28px", overflowY: "auto", flex: 1 }}>

          {section(null,
            text("SMASH TRACKER（スマトラ）は、大乱闘スマッシュブラザーズ SPECIAL の対戦戦績を記録・分析するための無料Webアプリです。日々の対戦を記録して、自分のプレイを振り返り、強くなるためのツールとして活用してください。")
          )}

          {section("非公式ツールについて",
            text("本サービスは個人が開発した非公式のファンツールです。任天堂株式会社、およびその関連会社・パートナーとは一切関係がなく、これらの企業による承認・推奨・スポンサーシップを受けていません。「大乱闘スマッシュブラザーズ」および関連するゲームタイトル・キャラクター名称は任天堂株式会社の登録商標です。")
          )}

          {section("使い方", <>
            <div style={{ fontSize: 13, color: T.sub, lineHeight: 2 }}>
              <div style={{ fontWeight: 600, color: T.text, marginBottom: 4 }}>1. 対戦を記録する</div>
              使用キャラと戦闘力を入力して「対戦開始」。相手キャラを選んで勝ち/負けを記録します。
              <div style={{ fontWeight: 600, color: T.text, marginTop: 12, marginBottom: 4 }}>2. 分析する</div>
              「分析」タブでキャラ別勝率、マッチアップ、戦闘力推移、対戦ヒートマップなどを確認できます。
              <div style={{ fontWeight: 600, color: T.text, marginTop: 12, marginBottom: 4 }}>3. シェアする</div>
              対戦結果や戦闘力推移をX（Twitter）やLINEでシェアできます。
              <div style={{ fontWeight: 600, color: T.text, marginTop: 12, marginBottom: 4 }}>4. クラウド同期</div>
              ログインすると、データがクラウドに保存され、スマホとPCなど複数の端末で利用できます。
            </div>
          </>)}

          {section("主な機能", <>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {[
                "対戦記録（使用キャラ、相手キャラ、勝敗、戦闘力、メモ）",
                "キャラ別勝率・マッチアップ分析",
                "戦闘力の推移グラフ（日単位 / 試合単位）",
                "日別・時間帯別の戦績分析",
                "対戦ヒートマップ（GitHub風カレンダー）",
                "SNSシェア機能（X, LINE, テキストコピー）",
                "VIP到達記録",
                "クラウドデータ同期（Google / メール認証）",
                "多言語対応（日本語・English）",
                "PWA対応（ホーム画面に追加可能）",
                "CSVエクスポート",
              ].map((item, i) => (
                <li key={i} style={{ fontSize: 13, color: T.sub, lineHeight: 1.8 }}>
                  ・{item}
                </li>
              ))}
            </ul>
          </>)}

          {section("利用規約・プライバシーポリシー", <>
            <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.8, marginBottom: 12 }}>
              本サービスのご利用にあたっては、利用規約およびプライバシーポリシーに同意いただく必要があります。
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { onClose(); if (onOpenLegal) onOpenLegal("terms"); }}
                style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.brd}`, background: T.card, color: T.accent, fontSize: 13, fontWeight: 600 }}
              >
                利用規約
              </button>
              <button
                onClick={() => { onClose(); if (onOpenLegal) onOpenLegal("privacy"); }}
                style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.brd}`, background: T.card, color: T.accent, fontSize: 13, fontWeight: 600 }}
              >
                プライバシーポリシー
              </button>
            </div>
          </>)}

          {section("お問い合わせ", <>
            <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.8, marginBottom: 10 }}>
              バグ報告、機能要望、データ削除依頼など、お気軽にお問い合わせください。
            </div>
            <a
              href="https://forms.gle/KtoWRKo1ciJNd7eS9"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block", padding: "8px 20px", borderRadius: 8,
                background: T.accentSoft, color: T.accent, fontSize: 13, fontWeight: 700,
                textDecoration: "none",
              }}
            >
              お問い合わせフォーム
            </a>
          </>)}

        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.brd}`, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontSize: 14, fontWeight: 700 }}
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
