import Head from "next/head";
import Link from "next/link";

export default function About() {
  return (
    <>
      <Head>
        <title>Giới thiệu GPTPhat.Com</title>
        <meta name="description" content="ptPhat là dự án trí tuệ nhân tạo chatbot hỏi đáp về Đạo Phật giúp cho người dùng muốn tìm hiểu những kiến thức chung về Đạo Phật" />
        <meta name="keywords" content="Tam Bảo,Kinh Phật, Phật Giáo, Phật Pháp, ChatGpt, Trí Tuệ Nhân Tạo, Đạo Phật, Hỏi đáp Đạo Phật, Hỏi đáp Phật Giáo, Kinh Phật Giáo, Phật Pháp Nhiệm Màu" />
        <meta
          name="viewport"
          content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-1 dark">
        <div className="relative m-auto flex gap-4 p-4 text-base md:max-w-2xl md:gap-6 md:py-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
          <div className="prose mt-[-2px] w-full dark:prose-invert">
            <div className="right-0 top-[26px] m-0">
              <div className="prose dark:prose-invert">
                <div className="mt-2 text-4xl font-bold">Giới thiệu <Link href="/">GPTPhat.Com</Link></div>

                <p>Con đem hết lòng thành kính đảnh lễ: Phật, Pháp, Tăng</p>
                <p><Link href="/">GPTPhat.Com</Link> là dự án trí tuệ nhân tạo chatbot hỏi đáp về Đạo Phật giúp cho người dùng muốn tìm hiểu những kiến thức chung về Đạo Phật.</p>
                <p> <Link href="/">GPTPhat.Com</Link> sử dụng những bài viết, sách của các vị tu sĩ, thiền sư thế giới như: Thiền sư Mahasi, Thiền sư Ajahn Chah, Thiền sư Pa-Auk, Thiền sư U Pandita, Bhikkhu Bodhi…, các vị tu sĩ Việt Nam như: Hòa thượng Hộ Tông, Hòa thượng Thích Minh Châu, Đại đức Indacanda, Hòa thượng Thích Thanh Từ, Hòa thượng Thích Tuệ Sỹ….cùng rất nhiều các tu sĩ, học giả mà chúng tôi không kể hết được, xin tri ân và thành kính những tác phẩm của các Vị ấy.</p>
                <p>Xin gửi lời cảm ơn trân trọng đến các vị tu sĩ, những vị thiền sư, học giả của thế giới và Việt Nam đã cung cấp các dữ liệu dưới dạng sách, bài viết trên các trang web : <a
                  href="https://budsas.org"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  budsas.org
                </a>, (của chú Bình Anson), <a
                  href="https://phaptru.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                    phaptru.com
                  </a> (của anh Trương Hồng Hạnh), <a
                    href="https://theravada.vn"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    theravada.vn
                  </a> (ban biên tập)</p>
                <br></br>
                <p>Dự án sử dụng công nghệ trí tuệ nhân tạo của nhóm tác giả: <a
                  href="https://huggingface.co/Viet-Mistral/Vistral-7B-Chat"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Vietnamese Mistral
                </a> (Huu Nguyen, Thuat Nguyen, Chien Nguyen, Huu Huy Nguyen, Thien Huu Nguyen….)</p>
                <br></br>
                <p>Sử dụng giao diện của: <a
                  href="https://github.com/mckaywrigley/chatbot-ui"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Chatbot UI
                </a></p>

                <p>Nhóm phát triển dự án: Nguyễn Viết Huy và Nguyễn Thế Hùng</p>
                <p>Mọi góp ý xin email đến nhóm phát triển dự án : <Link href="mailto:ujjotavn@gmail.com">ujjotavn@gmail.com</Link></p>
                <p>Trân trọng!</p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>

  )
}