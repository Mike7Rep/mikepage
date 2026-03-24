
const colorText1 = " !text-gray-800"
const styleh3 = "text-md text-left uppercase  font-bold tracking-tight"

export default function Berufserfahrung
(
  {funktion, timeline, firma, beschreibung, liste}:
  { funktion: string, timeline: string, firma: string, beschreibung: string, liste: string[] }
) {


  return (
    <section className={"text-sm py-2" + colorText1}>
      <div className={"flex flex-row justify-between items-end pb-2"}>
        <h3 className={styleh3}>{funktion}</h3>
        <p className={"text-sm"}>{timeline}</p>
      </div>
      <span className={"text-sm font-light italic"}>{firma}</span>
      <p>{beschreibung}</p>
      <ul className={"py-3"}>
        {liste.map((item, idx) => (
          <li
            className={"list-disc pl-5 py-0.5 ml-5 text-[0.8rem]"}
            key={idx}>{item}</li>
        ))}
      </ul>
    </section>
  )

}