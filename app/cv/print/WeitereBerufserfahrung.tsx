// app/cv/print/WeitereBerufserfahrung.tsx


export default function WeitereBerufserfahrung
(
  {funktion, ort, start, end} :
  {funktion:string, ort:string, start:string, end:string}
)
{
  return (
    <li className={"flex flex-row justify-between"}>
      <p><span className={"font-bold"}>{funktion}</span>, {ort}</p>
      <div className={"grid grid-cols-[1fr_30px_50px] items-center"}>
        <p className={"text-center"}>{start}</p>
        <p className={"text-center"}>-</p>
        <p className={"text-center"}>{end}</p>
      </div>

    </li>
  )
}