const TERMS_SECTIONS = [
  {
    title: "第1条 サービスの概要",
    content: `本サービス「SMASH TRACKER」（以下「本サービス」）は、大乱闘スマッシュブラザーズシリーズ（以下「スマブラ」）の対戦戦績を記録・管理することを目的とした、個人が開発・運営するWebアプリケーションです。

本サービスは無料でご利用いただけます。一部機能のご利用にはアカウント登録が必要です。

本サービスは任天堂株式会社の公式サービスではなく、ファンが独立して開発した非公式ツールです。`,
  },
  {
    title: "第2条 利用条件・年齢制限",
    content: `本サービスをご利用いただくにあたり、以下の条件に同意していただく必要があります。

・本規約のすべての条項に同意すること
・アカウント登録が必要な機能を利用する場合は、正確な情報を登録すること
・アカウントの管理は利用者自身の責任で行うこと

【未成年者の利用について】
本サービスに年齢制限はありませんが、未成年者が本サービスを利用する場合は、事前に親権者または法定代理人の同意を得てください。親権者または法定代理人が本サービスの利用を承認した場合、本規約に同意したものとみなします。`,
  },
  {
    title: "第3条 禁止事項",
    content: `利用者は、本サービスの利用にあたり、以下の行為を行ってはなりません。

・本サービスへの不正アクセス、または不正アクセスを試みる行為
・サーバーやネットワークに過大な負荷をかける行為（DDoS攻撃等）
・他の利用者の情報を不正に収集・利用する行為
・虚偽の情報を登録・送信する行為
・本サービスのリバースエンジニアリング、逆コンパイル、または逆アセンブルを行う行為
・本サービスを通じて、第三者の著作権・商標権・プライバシーその他の権利を侵害するコンテンツを送信する行為
・法令または公序良俗に違反する行為
・その他、運営者が不適切と判断する行為`,
  },
  {
    title: "第4条 ユーザー投稿コンテンツの免責",
    content: `利用者がメモ欄等に入力・投稿したコンテンツ（以下「利用者コンテンツ」）については、その内容・正確性・適法性について運営者は一切の責任を負いません。

利用者コンテンツが第三者の権利を侵害している場合、または法令に違反する場合、当該コンテンツの削除および利用停止措置を取ることがあります。

本条は、特定電気通信役務提供者の損害賠償責任の制限及び発信者情報の開示に関する法律（プロバイダ責任制限法）の適用を妨げるものではありません。`,
  },
  {
    title: "第5条 免責事項・サービスの変更・終了",
    content: `本サービスは現状有姿で提供されます。運営者は以下の点について一切の責任を負いません。

・登録された対戦データの正確性・完全性・保全性の保証
・サービスの中断、停止、または終了による損害
・システム障害やデータ消失による損害
・第三者による不正アクセスによる損害
・本サービスを通じて得た情報の利用に起因する損害

本サービスは予告なく内容を変更、または提供を終了する場合があります。サービス終了時には、可能な範囲で事前告知を行いますが、これを保証するものではありません。

重要なデータは定期的にCSVエクスポート機能を活用して、利用者自身でバックアップを行ってください。バックアップの実施は利用者自身の責任で行うものとします。`,
  },
  {
    title: "第6条 任天堂株式会社との関係・著作権",
    content: `本サービスは、大乱闘スマッシュブラザーズシリーズのファンが個人として開発した非公式ツールです。

本サービスは任天堂株式会社、またはその関連会社・パートナーとは一切関係がなく、これらの企業による承認・推奨・スポンサーシップを受けていません。

「大乱闘スマッシュブラザーズ」「Nintendo Switch」およびその他のゲームタイトル・キャラクター名称は任天堂株式会社の登録商標または商標です。本サービスはこれらの商標を権利者の許可なく商業目的で使用するものではなく、非商業的なファン活動として運営しています。

本サービスで参照されるキャラクター画像・名称等の著作権は任天堂株式会社ならびに各権利者に帰属します。これらの素材は情報提供目的にのみ使用されます。`,
  },
  {
    title: "第7条 知的財産権",
    content: `本サービスのコード、独自のUIデザイン、およびオリジナルコンテンツの著作権は運営者に帰属します。

利用者が本サービスに登録した対戦記録データに関する権利は、利用者自身に帰属します。`,
  },
  {
    title: "第8条 規約の変更",
    content: `運営者は、必要と判断した場合に本規約を変更することができます。

重要な変更を行う場合は、可能な範囲でサービス内での通知や案内を行います。変更後の規約は本サービス上での掲示をもって効力を生じるものとし、変更後に本サービスを継続して利用した場合は、変更後の規約に同意したものとみなします。`,
  },
  {
    title: "第9条 準拠法・管轄",
    content: `本規約は日本法に準拠して解釈されます。本規約に関連する紛争については、運営者の所在地を管轄する裁判所を専属的合意管轄裁判所とします。`,
  },
];

const PRIVACY_SECTIONS = [
  {
    title: "1. 収集する情報と利用目的",
    content: `本サービスでは、個人情報の保護に関する法律（個人情報保護法）に基づき、以下の情報を収集します。

【アカウント情報】
・メールアドレス（アカウント登録・認証・お問い合わせへの対応に使用）
・ユーザー名またはニックネーム

【Google認証を利用した場合】
・Googleアカウントのメールアドレス
・Googleアカウントのプロフィール名
・Googleが提供する一意の識別子（UID）
・プロフィール画像URL（取得可能な場合）
※ Googleのパスワードは取得しません
※ 本サービスはGoogle API Services User Data Policyに準拠し、取得したGoogleアカウント情報をサービスの認証・機能提供以外の目的に使用しません

【利用データ】
・対戦記録（使用キャラクター、対戦相手キャラクター、勝敗等、利用者が入力した情報）
・サービス利用日時
・アクセスログ（IPアドレス、ブラウザ情報等）

【利用目的】
・本サービスの提供および維持
・アカウントの認証および管理
・対戦戦績データの保存・表示・分析機能の提供
・サービスの不正利用の検知および防止
・サービスの改善および新機能の開発
・利用者からのお問い合わせへの対応

収集した情報をマーケティングや広告目的で使用することはありません。`,
  },
  {
    title: "2. 第三者への情報提供",
    content: `利用者の個人情報を第三者に販売・賃貸・提供することは一切行いません。

ただし、本サービスの運営にあたり、以下のサービス・インフラを利用しており、サービス提供に必要な範囲で情報が共有されます。利用者はこれらの第三者サービスのプライバシーポリシーについても確認してください。

・Supabase（データベース・認証基盤）
　- データ保管リージョン: 東京（ap-northeast-1）またはSupabaseが指定するリージョン
　- 対戦データやアカウント情報の保管に使用
　- 適用ポリシー: https://supabase.com/privacy

・Cloudflare Pages（ホスティング）
　- アクセスログの収集が行われる場合があります
　- 適用ポリシー: https://www.cloudflare.com/privacypolicy/

・Google OAuth（認証）
　- Google API Services User Data Policyに準拠
　- 適用ポリシー: https://policies.google.com/privacy

また、法令に基づく開示要求があった場合は、必要な範囲で情報を提供することがあります。この場合、可能な限り利用者に通知します。`,
  },
  {
    title: "3. データの保管とセキュリティ",
    content: `利用者のデータはSupabaseが提供するクラウドデータベースに保管されます。データの保管リージョンについては「2. 第三者への情報提供」をご参照ください。

セキュリティ確保のため、以下の措置を講じています。

・通信の暗号化（HTTPS/TLS）
・データベースへのアクセス制御（Row Level Security）
・認証トークンの適切な管理

ただし、インターネット上での完全なセキュリティを保証することはできません。不審なアクセスに気づいた場合は速やかにお問い合わせください。

データのバックアップは利用者自身の責任で定期的に行ってください（CSVエクスポート機能をご利用いただけます）。運営者はデータの損失について責任を負いません。`,
  },
  {
    title: "4. ローカルストレージ・Cookie等の外部送信",
    content: `本サービスでは、電気通信事業法に基づく外部送信規律に従い、以下のブラウザ機能を使用することをお知らせします。

【ローカルストレージ】
・保存される情報: 対戦データ、設定情報（テーマ、ダークモード等）、ログイン状態
・目的: オフライン時のデータ保持、個人設定の保存
・送信先: 外部送信なし（端末内にのみ保存）

【Cookie（認証用）】
・保存される情報: Supabaseが発行する認証セッショントークン
・目的: ログイン状態の維持
・送信先: Supabase（supabase.co）

トラッキング目的のサードパーティCookieは使用していません。`,
  },
  {
    title: "5. データの保持期間",
    content: `利用者のデータは、アカウントが有効である限り保持されます。

アカウントを削除した場合、またはデータ削除の要求があった場合は、合理的な期間内（通常30日以内）に該当データを削除します。ただし、法的義務の履行に必要な情報については、義務が消滅するまで保持する場合があります。`,
  },
  {
    title: "6. 保有個人データの開示・訂正・削除等の手続き",
    content: `個人情報保護法に基づき、利用者は自身の保有個人データについて以下の権利を有します。

・利用目的の通知: 保有個人データの利用目的の通知を求める権利
・開示請求: 本サービスが保有する自身のデータの開示を求める権利
・訂正・追加・削除: 内容が事実でない場合に訂正・追加・削除を求める権利
・利用停止・消去: 個人情報保護法に基づき、利用停止または消去を求める権利
・第三者提供の停止: 第三者への提供の停止を求める権利
・エクスポート: CSVエクスポート機能を通じて、登録した対戦データを取得する権利

これらの権利を行使する場合は、本ポリシー末尾のお問い合わせ先までご連絡ください。ご本人確認のうえ、合理的な期間内に対応します。`,
  },
  {
    title: "7. 未成年者の個人情報",
    content: `本サービスに年齢制限はありませんが、16歳未満の方が個人情報を提供する場合は、親権者または法定代理人の同意が必要です。

未成年者の個人情報が親権者の同意なく収集されたことが判明した場合は、速やかに当該情報を削除します。該当する場合はお問い合わせ先までご連絡ください。`,
  },
  {
    title: "8. プライバシーポリシーの変更",
    content: `本ポリシーは必要に応じて改定される場合があります。個人の権利に重大な影響を与える変更を行った場合は、本サービス上での掲示等により利用者にお知らせします。

変更後に本サービスを継続して利用した場合は、変更後のポリシーに同意したものとみなします。`,
  },
  {
    title: "9. お問い合わせ",
    content: `本プライバシーポリシーに関するご質問、または保有個人データに関する権利の行使については、以下のお問い合わせフォームよりご連絡ください。

お問い合わせフォーム:
https://forms.gle/KtoWRKo1ciJNd7eS9

お問い合わせ内容によっては、ご本人確認をお願いする場合があります。通常3営業日以内に対応いたします。`,
  },
];

import { useEffect } from "react";
import { useI18n } from "../i18n/index.jsx";

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
  const { t } = useI18n();
  const isTerms = page === "terms";

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const title = isTerms ? t("settings.terms") : t("settings.privacy");
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
                {t("legal.effectiveDate")}
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
              aria-label={t("legal.close")}
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
                {t("legal.readFirst")}
              </div>
              <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>
                {t("legal.readFirstDesc")}
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
                {t("legal.privacyNote")}<a href="https://forms.gle/KtoWRKo1ciJNd7eS9" target="_blank" rel="noopener noreferrer" style={{ color: T.accent, fontWeight: 700 }}>{t("legal.privacyNoteLink")}</a>{t("legal.privacyNoteEnd")}
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
            {t("legal.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
