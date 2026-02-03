import { useRef, useState } from "react";

export default function DraggableButton() {
    const [pos, setPos] = useState(
        {
            x: 16,
            y: 220
        }
    )
    const [rback, setRback] = useState(
        {
            x: 16,
            y: 220
        }
    )
    const [lback, setLback] = useState(
        {
            x: 1200,
            y: 220
        }
    )

    const dragRef = useRef(
        {
            dragging:false,
            offsetX: 0,
            offsetY: 0
        }
    )

    return(
        <button
            style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                padding: "10px 14px",
                //borderRadius: 999,
                border: "1px solid black",
                background: "white",
                cursor: "grab",
                color: "black",

                touchAction: "none",
                //브라우저에서 제공하는 터치 리액션 필요 없고 내가 제어할거임

                userSelect: "none"
                // 글자가 선택 되지 않게 함
            }}
            
            onPointerDown={(e)=>{
                dragRef.current.dragging = true

                const loc = e.currentTarget.getBoundingClientRect()
                // 버튼의 뷰포트 기준 좌표를 받아옴

                dragRef.current.offsetX = e.clientX - loc.left
                dragRef.current.offsetY = e.clientY - loc.top
                // offsetXY를 정함, 왼쪽 위를 클릭하면 x,y 둘 다 음수, 오른쪽 아래를 클릭하면 둘 다 양수

                try{
                    e.currentTarget.setPointerCapture(e.pointerId)
                    // 이거 안 쓰면 클릭하고 딴데서 클릭 떼면 계속 따라다님
                } catch{}
            }}

            onPointerMove={(e)=>{
                if(!dragRef.current.dragging) return

                const nextX = e.clientX - dragRef.current.offsetX
                const nextY = e.clientY - dragRef.current.offsetY

                setPos({x:nextX, y:nextY})
            }}

            
            onPointerUp={(e)=>{
                dragRef.current.dragging = false
                // if(e.clientX<50){
                //     setPos({x:rback.x, y:rback.y})
                // } else{
                //     setPos({x:lback.x, y:lback.y})
                // }
            }}

            onPointerCancel={()=>{
                dragRef.current.dragging = false
            }}


        >
            금연 상담
        </button>
    )
}

