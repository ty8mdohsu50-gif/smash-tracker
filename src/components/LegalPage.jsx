const TERMS_SECTIONS = [
  {
    title: "第1条 サービスの概要",
    content: `本サービス「SMASH TRACKER」（以下「本サービス」）は、大乱闘スマッシュブラザーズシリーズ（以下「スマブラ」）の対戦戦績を記録・管理することを目的とした、個人が開発・運営するWebアプリケーションです。

本サービスは無料でご利用いただけます。一部機能のご利用にはアカウント登録が必要です。`,
  },
  {
    title: "第2条 利用条件",
    content: `本サービスをご利用いただくにあたり、以下の条件に同意していただく必要があります。

・本規約のすべての条項に同意すること
・アカウント登録が必要な機能を利用する場合は、正確な情報を登録すること
・アカウントの管理は利用者自身の責任で行うこと
・年齢制限のある機能については、該当年齢を満たしていること`,
  },
  {
    title: "第3条 禁止事項",
    content: `利用者は、本サービスの利用にあたり、以下の行為を行ってはなりません。

・本サービスへの不正アクセス、または不正アクセスを試みる行為
・サーバーやネットワークに過大な負荷をかける行為（DDoS攻撃等）
・他の利用者の情報を不正に収集・利用する行為
・虚偽の情報を登録・送信する行為
・本サービスのリバースエンジニアリング、逆コンパイル、または逆アセンブルを行う行為
・本サービスを通じて、第三者の権利を侵害するコンテンツを送信する行為
・法令または公序良俗に違反する行為
・その他、運営者が不適切と判断する行為`,
  },
  {
    title: "第4条 免責事項",
    content: `本サービスは現状有姿で提供されます。運営者は以下の点について一切の責任を負いません。

・登録された対戦データの正確性・完全性・保全性の保証
・サービスの中断、停止、または終了による損害
・システム障害やデータ消失による損害
・第三者による不正アクセスによる損害
・本サービスを通じて得た情報の利用に起因する損害

本サービスは予告なく内容を変更、または提供を終了する場合があります。重要なデータはCSVエクスポート等を活用し、利用者自身でバックアップを行ってください。`,
  },
  {
    title: "第5条 任天堂株式会社との関係",
    content: `本サービスは、大乱闘スマッシュブラザーズシリーズのファンが個人として開発した非公式ツールです。

本サービスは任天堂株式会社、またはその関連会社・パートナーとは一切関係がなく、これらの企業による承認・推奨・スポンサーシップを受けていません。

「大乱闘スマッシュブラザーズ」および関連するゲームタイトルは任天堂株式会社の登録商標です。`,
  },
  {
    title: "第6条 知的財産権",
    content: `本サービスで表示・参照されるゲームキャラクター名称、キャラクター画像、ゲームタイトルおよびその関連素材は、任天堂株式会社ならびに各権利者に帰属します。

本サービスのコード、独自のUIデザイン、およびオリジナルコンテンツの著作権は運営者に帰属します。

利用者が本サービスに登録した対戦記録データに関する権利は、利用者自身に帰属します。`,
  },
  {
    title: "第7条 規約の変更",
    content: `運営者は、必要と判断した場合に、利用者への事前通知なく本規約を変更することができます。

変更後の規約は本サービス上での掲示をもって効力を生じるものとし、変更後に本サービスを継続して利用した場合は、変更後の規約に同意したものとみなします。

重要な変更については、可能な範囲でサービス内での通知や案内を行います。`,
  },
  {
    title: "第8条 準拠法・管轄",
    content: `本規約は日本法に準拠して解釈されます。本規約に関連する紛争については、運営者の所在地を管轄する裁判所を専属的合意管轄裁判所とします。`,
  },
];

const PRIVACY_SECTIONS = [
  {
    title: "1. 収集する情報",
    content: `本サービスでは、サービスの提供にあたり以下の情報を収集します。

【アカウント情報】
・メールアドレス（アカウント登録・認証に使用）
・ユーザー名またはニックネーム

【Google認証を利用した場合】
・Googleアカウントのメールアドレス
・Googleアカウントのプロフィール名
・Googleが提供する一意の識別子（UID）
・プロフィール画像URL（取得可能な場合）
※ Googleのパスワードは取得しません

【利用データ】
・対戦記録（使用キャラクター、対戦相手キャラクター、勝敗、ステージ等、利用者が入力した情報）
・サービス利用日時
・アクセスログ（IPアドレス、ブラウザ情報等）`,
  },
  {
    title: "2. 情報の利用目的",
    content: `収集した情報は、以下の目的にのみ使用します。

・本サービスの提供および維持
・アカウントの認証および管理
・対戦戦績データの保存・表示・分析機能の提供
・サービスの不正利用の検知および防止
・サービスの改善および新機能の開発
・利用者からのお問い合わせへの対応

収集した情報をマーケティングや広告目的で使用することはありません。`,
  },
  {
    title: "3. 第三者への情報提供",
    content: `利用者の個人情報を第三者に販売・賃貸・提供することは一切行いません。

ただし、本サービスの運営にあたり、以下のサービス・インフラを利用しており、これらのサービスに対して必要最低限の情報が提供される場合があります。

・Supabase（データベース・認証基盤）: 対戦データやアカウント情報の保管に使用。Supabaseのプライバシーポリシーが適用されます。
・Vercel / GitHub Pages等（ホスティング）: アクセスログの収集が行われる場合があります。

また、法令に基づく開示要求があった場合は、必要な範囲で情報を提供することがあります。`,
  },
  {
    title: "4. データの保管とセキュリティ",
    content: `利用者のデータはSupabaseが提供するクラウドデータベースに保管されます。

セキュリティ確保のため、以下の措置を講じています。

・通信の暗号化（HTTPS/TLS）
・データベースへのアクセス制御（Row Level Security）
・認証トークンの適切な管理
・定期的なセキュリティレビュー

ただし、インターネット上での完全なセキュリティを保証することはできません。不審なアクセスに気づいた場合は速やかにお問い合わせください。`,
  },
  {
    title: "5. データの保持期間",
    content: `利用者のデータは、アカウントが有効である限り保持されます。

アカウントを削除した場合、またはデータ削除の要求があった場合は、合理的な期間内に該当データを削除します。ただし、法的義務の履行に必要な情報については、義務が消滅するまで保持する場合があります。`,
  },
  {
    title: "6. 利用者の権利",
    content: `利用者は、自身の個人情報に関して以下の権利を有します。

・アクセス権: 本サービスが保有する自身のデータを確認する権利
・訂正権: 不正確なデータの訂正を求める権利
・削除権: サービス内のデータ削除機能を通じて、または問い合わせにより、データの削除を求める権利
・エクスポート権: CSVエクスポート機能を通じて、登録した対戦データを取得する権利

これらの権利を行使する場合は、本ポリシー末尾のお問い合わせ先までご連絡ください。`,
  },
  {
    title: "7. Cookieおよびローカルストレージ",
    content: `本サービスでは、サービス機能の提供のためにブラウザのローカルストレージおよびCookieを使用することがあります。

・認証セッションの維持
・テーマ設定などの個人設定の保存

トラッキング目的のサードパーティCookieは使用していません。`,
  },
  {
    title: "8. プライバシーポリシーの変更",
    content: `本ポリシーは必要に応じて改定される場合があります。重要な変更を行った場合は、本サービス上での掲示等により利用者にお知らせします。

変更後に本サービスを継続して利用した場合は、変更後のポリシーに同意したものとみなします。`,
  },
  {
    title: "9. お問い合わせ",
    content: `本プライバシーポリシーに関するご質問、またはデータに関する権利の行使については、以下の連絡先までお問い合わせください。

メールアドレス: contact@smash-tracker.example.com

お問い合わせ内容によっては、本人確認をお願いする場合があります。`,
  },
];

function SectionBlock({ title, content, T }) {
  return (
    <div
      style={{
        marginBottom: 24,
        padding: "16px 18px",
        background: T.inp,
        borderRadius: 12,
        border: `1px solid ${T.brd}`,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: T.accent,
          marginBottom: 10,
          letterSpacing: "0.01em",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13,
          color: T.sub,
          lineHeight: 1.8,
          whiteSpace: "pre-wrap",
        }}
      >
        {content}
      </div>
    </div>
  );
}

export default function LegalPage({ T, onClose, page }) {
  const isTerms = page === "terms";

  const title = isTerms ? "利用規約" : "プライバシーポリシー";
  const sections = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        animation: "fadeIn .15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card,
          borderRadius: 16,
          width: "100%",
          maxWidth: 640,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
          animation: "fadeUp .2s ease",
          overflow: "hidden",
        }}
      >
        {/* Fixed header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: `1px solid ${T.brd}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: T.text,
                  letterSpacing: "-0.02em",
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: 11, color: T.dim, marginTop: 3 }}>
                施行日: 2026年4月4日
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: `1px solid ${T.brd}`,
                background: T.inp,
                color: T.sub,
                fontSize: 18,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginLeft: 12,
              }}
              aria-label="閉じる"
            >
              x
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            padding: "20px 24px 28px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {isTerms && (
            <div
              style={{
                padding: "12px 14px",
                background: T.accentSoft,
                border: `1px solid ${T.accentBorder}`,
                borderRadius: 10,
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 13, color: T.text, fontWeight: 600, marginBottom: 4 }}>
                はじめにお読みください
              </div>
              <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>
                本規約は、SMASH TRACKERをご利用いただくすべての方に適用されます。本サービスをご利用いただくことで、本規約に同意いただいたものとみなします。
              </div>
            </div>
          )}

          {sections.map((section) => (
            <SectionBlock
              key={section.title}
              title={section.title}
              content={section.content}
              T={T}
            />
          ))}

          {!isTerms && (
            <div
              style={{
                padding: "12px 14px",
                background: T.accentSoft,
                border: `1px solid ${T.accentBorder}`,
                borderRadius: 10,
                marginTop: 8,
              }}
            >
              <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>
                本ポリシーにご不明な点がございましたら、<strong style={{ color: T.text }}>contact@smash-tracker.example.com</strong> までお気軽にお問い合わせください。
              </div>
            </div>
          )}
        </div>

        {/* Fixed footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${T.brd}`,
            flexShrink: 0,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "none",
              background: T.accent,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.01em",
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
