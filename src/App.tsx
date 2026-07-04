import RichtextEditor from "./components/editor/Tiptap";
import useTiptapEditor from "./hooks/useTiptapEditor";

export default function App() {
  const { editor } = useTiptapEditor({
    placeholder: "Write, type '/' for commands",
  });

  return (
    <div className="max-w-5xl mx-auto px-5 ">
      <RichtextEditor
        editor={editor}
        enablePreview={true}
        wrapperClassName="max-w-5xl mx-auto py-5"
        enableModeToggle
        enableBubbleMenu={false}
      />

      {/* <NotionEditor
        editor={editor}
        className="max-w-5xl mx-auto min-h-screen"
      /> */}

      {/* <RenderJSON
        className="py-5 px-5 max-w-7xl mx-auto"
        enableTableOfContents
        content={{
          type: "doc",
          content: [
            {
              type: "image",
              attrs: {
                src: "https://ik.imagekit.io/evoting/22e12f1d-7012-4d69-9746-28b0f20ec2de.png",
                alt: "22e12f1d-7012-4d69-9746-28b0f20ec2de",
                title: "22e12f1d-7012-4d69-9746-28b0f20ec2de",
                width: null,
                height: null,
                alignment: "center",
              },
            },
            {
              type: "heading",
              attrs: {
                textAlign: null,
                level: 1,
              },
              content: [
                {
                  type: "text",
                  text: "Welcome to tiptap-",
                },
                {
                  type: "text",
                  marks: [
                    {
                      type: "textStyle",
                      attrs: {
                        backgroundColor: null,
                        color: "#8b5cf6",
                        fontFamily: null,
                        fontSize: null,
                        lineHeight: null,
                      },
                    },
                  ],
                  text: "react",
                },
                {
                  type: "text",
                  text: "-ui",
                },
              ],
            },
            {
              type: "table",
              content: [
                {
                  type: "tableRow",
                  content: [
                    {
                      type: "tableHeader",
                      attrs: {
                        colspan: 1,
                        rowspan: 1,
                        colwidth: null,
                        align: null,
                      },
                      content: [
                        {
                          type: "paragraph",
                          attrs: {
                            textAlign: null,
                          },
                          content: [
                            {
                              type: "text",
                              text: "Name",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "tableHeader",
                      attrs: {
                        colspan: 1,
                        rowspan: 1,
                        colwidth: null,
                        align: null,
                      },
                      content: [
                        {
                          type: "paragraph",
                          attrs: {
                            textAlign: null,
                          },
                          content: [
                            {
                              type: "text",
                              text: "Age",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "tableHeader",
                      attrs: {
                        colspan: 1,
                        rowspan: 1,
                        colwidth: null,
                        align: null,
                      },
                      content: [
                        {
                          type: "paragraph",
                          attrs: {
                            textAlign: null,
                          },
                          content: [
                            {
                              type: "text",
                              text: "Hobby",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "tableRow",
                  content: [
                    {
                      type: "tableCell",
                      attrs: {
                        colspan: 1,
                        rowspan: 1,
                        colwidth: null,
                        align: null,
                      },
                      content: [
                        {
                          type: "paragraph",
                          attrs: {
                            textAlign: null,
                          },
                          content: [
                            {
                              type: "text",
                              text: "John Doe",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "tableCell",
                      attrs: {
                        colspan: 1,
                        rowspan: 1,
                        colwidth: null,
                        align: null,
                      },
                      content: [
                        {
                          type: "paragraph",
                          attrs: {
                            textAlign: null,
                          },
                          content: [
                            {
                              type: "text",
                              text: "25",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "tableCell",
                      attrs: {
                        colspan: 1,
                        rowspan: 1,
                        colwidth: null,
                        align: null,
                      },
                      content: [
                        {
                          type: "paragraph",
                          attrs: {
                            textAlign: null,
                          },
                          content: [
                            {
                              type: "text",
                              text: "Basketball",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "tableRow",
                  content: [
                    {
                      type: "tableCell",
                      attrs: {
                        colspan: 1,
                        rowspan: 1,
                        colwidth: null,
                        align: null,
                      },
                      content: [
                        {
                          type: "paragraph",
                          attrs: {
                            textAlign: null,
                          },
                          content: [
                            {
                              type: "text",
                              text: "Foo Bar",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "tableCell",
                      attrs: {
                        colspan: 1,
                        rowspan: 1,
                        colwidth: null,
                        align: null,
                      },
                      content: [
                        {
                          type: "paragraph",
                          attrs: {
                            textAlign: null,
                          },
                          content: [
                            {
                              type: "text",
                              text: "20",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "tableCell",
                      attrs: {
                        colspan: 1,
                        rowspan: 1,
                        colwidth: null,
                        align: null,
                      },
                      content: [
                        {
                          type: "paragraph",
                          attrs: {
                            textAlign: null,
                          },
                          content: [
                            {
                              type: "text",
                              text: "Coding",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: "paragraph",
              attrs: {
                textAlign: null,
              },
              content: [
                {
                  type: "text",
                  marks: [
                    {
                      type: "bold",
                    },
                  ],
                  text: "Build modern React-based rich text editors with ease.",
                },
              ],
            },
            {
              type: "paragraph",
              attrs: {
                textAlign: null,
              },
              content: [
                {
                  type: "text",
                  text: "tiptap-react-ui is a modern, customizable, and developer-friendly WYSIWYG editor powered by Tiptap, Tailwind CSS, and shadcn/ui.",
                },
              ],
            },
            {
              type: "heading",
              attrs: {
                textAlign: null,
                level: 2,
              },
              content: [
                {
                  type: "text",
                  text: "✨ Key Features",
                },
              ],
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      attrs: {
                        textAlign: null,
                      },
                      content: [
                        {
                          type: "text",
                          text: "⚡ Plug and play setup with minimal configuration",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      attrs: {
                        textAlign: null,
                      },
                      content: [
                        {
                          type: "text",
                          text: "🌙 Dark and light mode support",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      attrs: {
                        textAlign: null,
                      },
                      content: [
                        {
                          type: "text",
                          text: "💻 Code blocks with syntax highlighting",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      attrs: {
                        textAlign: null,
                      },
                      content: [
                        {
                          type: "text",
                          text: "📄 JSON and HTML rendering support",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      attrs: {
                        textAlign: null,
                      },
                      content: [
                        {
                          type: "text",
                          text: "🔢 Character and word count utilities",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: "heading",
              attrs: {
                textAlign: null,
                level: 2,
              },
              content: [
                {
                  type: "text",
                  text: "🚀 Quick Start",
                },
              ],
            },
            {
              type: "codeBlock",
              attrs: {
                language: null,
              },
              content: [
                {
                  type: "text",
                  text: "npm i tiptap-react-ui @tiptap/core@latest @tiptap/pm@latest @tiptap/react@latest @tiptap/starter-kit@latest",
                },
              ],
            },
            {
              type: "paragraph",
              attrs: {
                textAlign: null,
              },
              content: [
                {
                  type: "text",
                  text: "That’s it. You’re ready to build beautiful editing experiences. Lorem ipsum dolor sit amet consectetur adipisicing elit. Excepturi, porro aspernatur cum in nihil nulla, dignissimos culpa provident eveniet, est aperiam sunt. Itaque autem at quam consequuntur nobis minima, vero vitae nisi cum quod voluptatibus magni odit sint voluptatem, doloribus sed laboriosam hic accusantium. Reiciendis dicta sit ex tenetur illo doloremque numquam consequatur eligendi sint nemo corrupti aspernatur odio iusto, quam error perspiciatis velit nulla mollitia expedita eum! Consequatur eligendi, error cum modi veniam ipsam ratione porro ex provident, exercitationem sequi id totam quas temporibus accusamus ad commodi quibusdam? Ratione enim ab ex sapiente? Ipsa corporis, veritatis obcaecati voluptatum at nulla rem cum vitae laborum tenetur quod praesentium natus id? Optio hic iste cum, voluptas deleniti aliquid laborum labore tenetur voluptatum minus sunt repudiandae dolorem harum, velit alias placeat ipsa perferendis ab accusantium sit ex delectus. Aliquid iusto aperiam deserunt adipisci. Omnis, odio! Harum repellendus ratione minima quisquam aspernatur error accusantium facere quia quibusdam. Voluptates, optio assumenda. At nesciunt molestias pariatur consectetur iure, laboriosam modi sequi non veritatis nisi facilis, optio a aut? Consequatur, perspiciatis autem. Veritatis doloribus, eveniet maxime tenetur, qui amet odio temporibus quisquam nostrum repellendus iure. Tempora eius dolore id ea iure quasi quidem, quos atque facilis minima eaque nesciunt doloremque, optio, temporibus eos. Id dolorem ratione laudantium facere commodi ullam, aliquid natus laborum perspiciatis rem, reprehenderit molestias atque? Cum excepturi ipsum ducimus exercitationem iusto eum perferendis quod architecto praesentium autem. Velit incidunt atque, nam beatae aperiam suscipit accusantium placeat. Libero modi voluptatibus cumque est officiis reiciendis nemo laudantium maxime dolorum, sed distinctio tenetur facere pariatur, velit similique maiores rerum voluptates accusamus. Ipsum commodi voluptate repellat reprehenderit dolor quos voluptas ad dolore velit veritatis. Laudantium voluptatum autem deleniti quas, voluptas quaerat rem ea modi, pariatur aliquam nisi optio iste velit voluptate dolorem molestiae distinctio repellendus illum in dicta. Earum velit voluptate eaque? Nesciunt, blanditiis dolorum voluptates quasi ut eos perspiciatis eveniet voluptatum, earum officia inventore facere? Magni deserunt deleniti ipsum esse officia tempora accusantium at quia nisi veniam possimus neque hic, iusto laboriosam! Recusandae odio deleniti facilis impedit unde animi doloribus labore minus? Inventore atque veritatis ex enim maiores, omnis fuga numquam harum voluptas mollitia odit eos ratione accusantium consequuntur nisi facere labore ab. Magni, quam quibusdam id odio repellendus perspiciatis nihil voluptatum cumque corrupti dolorum facere deleniti libero voluptas iure aliquid totam tempora quas ullam adipisci aut nobis repellat sint fuga. Quisquam porro iste, quibusdam sit nulla animi eius aliquid neque, architecto quos natus autem quae laudantium officiis necessitatibus, saepe veritatis fugit amet voluptatum voluptatibus deserunt eos eum sequi ipsa? Veritatis repellendus maxime nemo, aspernatur veniam magnam? Maxime quo assumenda consequuntur eaque quos voluptate, cumque commodi molestias. Autem reiciendis id, fugit magnam ea, fugiat magni voluptatem odio atque et aliquid illum natus sapiente veniam iste debitis veritatis omnis non soluta beatae. Assumenda itaque officiis eaque placeat nam amet ipsam vitae voluptatem sapiente perspiciatis cum sequi, fugiat, provident facere ipsum harum illum excepturi ea distinctio repudiandae illo dolores accusantium? Eum ratione officiis quae, nobis ullam illo. Fugiat earum sit explicabo numquam laudantium inventore unde praesentium, sapiente aspernatur quibusdam beatae at quae deleniti vitae hic minima dolorum! Non, ex eaque facere perspiciatis sed ratione doloremque nobis cupiditate mollitia a deserunt eius minus voluptas. Ipsam quaerat id tenetur animi! Earum fuga quos vitae perferendis cum accusantium architecto delectus nam consequuntur voluptatem libero obcaecati quasi, deleniti aspernatur voluptatibus consectetur dolorum aliquam molestiae sapiente impedit voluptates. Error dolore doloribus optio quas veniam voluptate cupiditate enim asperiores tenetur rem quibusdam doloremque est mollitia minima eaque repudiandae possimus, ipsum quo nam rerum perferendis nostrum dolorem consequatur? Repellat animi expedita a. Vero dolorem itaque a amet in reiciendis impedit, sed voluptatibus officia mollitia repellat ratione minus aspernatur perspiciatis commodi, vel, hic maiores ut suscipit! Sed quisquam nemo porro veniam vero corrupti, laboriosam, optio quia enim totam quo inventore, accusantium tempora doloremque delectus provident at obcaecati id earum. Ratione, totam ad. Ea excepturi dignissimos, aspernatur dicta mollitia impedit. Cumque quam magnam officia libero consectetur temporibus iste porro deserunt sed facilis, mollitia deleniti dolores corrupti vel qui ex eaque itaque voluptatem nobis commodi dolorem provident repudiandae. Ea saepe vitae nostrum unde repellendus, adipisci illum ipsa earum quod, beatae, similique commodi ipsum distinctio voluptas. Obcaecati quod sequi illo suscipit ullam nihil nam tempora placeat totam vitae aliquid possimus, quia excepturi perspiciatis dolor. Atque, suscipit nesciunt quidem ex, molestiae consequuntur voluptates nisi culpa sint, molestias quis! Dolore explicabo corporis alias cumque provident saepe rerum veritatis fuga ipsum sequi, eaque, consectetur nisi quia vitae harum asperiores voluptates ex consequatur repellendus exercitationem? Inventore molestiae ea perspiciatis, sit quo corporis eos omnis blanditiis consectetur est aperiam veniam maxime beatae soluta eaque? Voluptatum sed autem tenetur consectetur? Facilis dolorem molestias deleniti provident, non accusantium repudiandae, vitae ipsam vero officiis rerum laborum. Ducimus necessitatibus, deleniti, quas, ratione quisquam adipisci rem laborum error expedita voluptates iure consectetur dicta fugiat dolorem numquam corporis iste recusandae! Quas nam illo minima, rem consequatur reiciendis blanditiis, corporis perspiciatis architecto, quos nisi! Laboriosam, iste cum? Illo, hic velit consectetur tenetur aut, sed esse magni ipsum atque, cumque similique. Eius consequatur delectus molestiae error consectetur laborum accusamus nihil nemo, iste sit voluptas? Fuga ipsam laborum, dolorem doloremque doloribus natus ut impedit modi harum mollitia vero reprehenderit blanditiis ducimus sed delectus esse excepturi consectetur ex voluptatem labore molestiae, fugit similique? Delectus ipsa animi fuga ducimus consequuntur placeat id molestias cum quas autem, doloremque perspiciatis nobis voluptatibus ipsum at officiis, soluta error facere eum, rem provident nulla. Praesentium nostrum nam possimus laboriosam esse quam eius aperiam ab a! Non nulla dolores et earum, fugiat, asperiores tempore voluptatibus voluptates nobis esse aliquam incidunt odio laudantium. Consectetur vero eveniet ut dicta explicabo voluptates, ullam, voluptatibus rem, in omnis molestias! Sequi, ratione? Laudantium reiciendis quo commodi. Non voluptates assumenda porro. Officiis commodi reiciendis omnis id, incidunt voluptates. Commodi nostrum eos doloremque. Ipsum, veniam, hic enim molestias quam, nobis ipsam vitae maxime totam id fuga suscipit eligendi unde deserunt! Amet, at dicta, cum vitae consequatur reiciendis a consectetur quaerat veniam et eaque dignissimos voluptatum, dolorum excepturi.",
                },
              ],
            },
          ],
        }}
      />  */}
    </div>
  );
}
