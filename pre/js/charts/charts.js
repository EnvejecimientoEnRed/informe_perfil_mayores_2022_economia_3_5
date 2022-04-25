//Desarrollo de las visualizaciones
import * as d3 from 'd3';
import { numberWithCommas3 } from '../helpers';
import { getInTooltip, getOutTooltip, positionTooltip } from '../modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C',
COLOR_COMP_1 = '#528FAD', 
COLOR_COMP_2 = '#AADCE0',
COLOR_ANAG_PRIM_1 = '#BA9D5F', 
COLOR_ANAG_PRIM_2 = '#9E6C51',
COLOR_ANAG_COMP_1 = '#1C5A5E';

//Diccionario
let dictionary = {
    alimentacion: 'Alimentación',
    vestido: 'Vestido',
    vivienda: 'Vivienda',
    sanidad: 'Sanidad',
    ocio_cultura: 'Ocio y cultura',
    resto: 'Resto'
}

export function initChart(iframe) {
    //Lectura de datos
    d3.csv('https://raw.githubusercontent.com/CarlosMunozDiazCSIC/informe_perfil_mayores_2022_economia_3_5/main/data/distribucion_gasto_hogar_nacional_v2.csv', function(error,data) {
        if (error) throw error;

        //Declaramos fuera las variables genéricas
        let margin = {top: 20, right: 20, bottom: 20, left: 65},
            width = document.getElementById('chart').clientWidth - margin.left - margin.right,
            height = document.getElementById('chart').clientHeight - margin.top - margin.bottom;

        let svg = d3.select("#chart")
            .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        let gruposGasto = ['alimentacion','vestido', 'vivienda', 'sanidad', 'ocio_cultura', 'resto'];

        //Ejes X
        let x = d3.scaleLinear()
            .domain([0,100])
            .range([0,width]);

        let xAxis = function(svg) {
            svg.call(d3.axisBottom(x).ticks(5));
            svg.call(function(g) {
                g.call(function(g){
                    g.selectAll('.tick line')
                        .attr('class', function(d,i) {
                            if (d == 0) {
                                return 'line-special';
                            }
                        })
                        .attr('y1', '0')
                        .attr('y2', `-${height}`)
                });
            });
        } 
        
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        //Eje Y
        let y = d3.scaleBand()
            .domain(['total','mas65'])
            .range([0, height]);
        
        let tickLabels = ['Total', '65 y más'];

        let yAxis = function(g) {
            g.call(d3.axisLeft(y).tickFormat((d,i) => tickLabels[i]))
        }
        
        svg.append("g")
            .attr("class", "yaxis")
            .call(yAxis);

        let color = d3.scaleOrdinal()
            .domain(gruposGasto)
            .range([COLOR_PRIMARY_1, COLOR_COMP_2, COLOR_COMP_1, COLOR_ANAG_COMP_1, COLOR_ANAG_PRIM_1, COLOR_ANAG_PRIM_2]);

        let stackedDataGasto = d3.stack()
            .keys(gruposGasto)
            (data);

        function init() {
            svg.append("g")
                .attr('class','chart-g')
                .selectAll("g")
                .data(stackedDataGasto)
                .enter()
                .append("g")
                .attr("fill", function(d) { return color(d.key); })
                .attr('class', function(d) {
                    return 'rect-1 ' + d.key;
                })
                .selectAll("rect")
                .data(function(d) { return d; })
                .enter()
                .append("rect")
                .attr('class','rect')
                .attr("y", function(d) { return y(d.data.grupo) + y.bandwidth() / 4; })
                .attr("x", function(d) { return 0; })
                .attr("width", function(d) { return x(0); })
                .attr("height", y.bandwidth() / 2)
                .on('mouseover', function(d,i,e){
                    //Opacidad de las barras
                    let other = svg.selectAll('.rect-1');
                    let current = this.parentNode.classList[1];
                    let _this = svg.selectAll(`.${current}`);
                    
                    other.each(function() {
                        this.style.opacity = '0.4';
                    });
                    _this.each(function() {
                        this.style.opacity = '1';
                    });

                    //Texto
                    console.log(d);                    
                    let html = '<p class="chart__tooltip--title">' + dictionary[current] + '</p>' + 
                        '<p class="chart__tooltip--text">Para este grupo de gasto, el gasto medio representa el x% <b>' + numberWithCommas3(parseFloat(data[1][current]).toFixed(2)) + '%</b> del total en este grupo de población</p>';
            
                    tooltip.html(html);

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);

                })
                .on('mouseout', function(d,i,e) {
                    //Quitamos los estilos de la línea
                    let bars = svg.selectAll('.rect-1');
                    bars.each(function() {
                        this.style.opacity = '1';
                    });
                
                    //Quitamos el tooltip
                    getOutTooltip(tooltip); 
                })
                .transition()
                .duration(2000)
                .attr("x", function(d) { return x(d[0]); })
                .attr("width", function(d) { return x(d[1]) - x(d[0]); });
        }

        function animateChart() {
            svg.selectAll('.rect')
                .attr("y", function(d) { return y(d.data.grupo) + y.bandwidth() / 4; })
                .attr("x", function(d) { return 0; })
                .attr("width", function(d) { return x(0); })
                .attr("height", y.bandwidth() / 2)
                .transition()
                .duration(2000)
                .attr("x", function(d) { return x(d[0]); })
                .attr("width", function(d) { return x(d[1]) - x(d[0]); });
        }

        //////
        ///// Resto - Chart
        //////
        init();

        //Animación del gráfico
        document.getElementById('replay').addEventListener('click', function() {
            animateChart();
        });

        //////
        ///// Resto
        //////

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_economia_3_5','distribucion_gasto_hogar');

        //Redes sociales > Antes tenemos que indicar cuál sería el texto a enviar
        setRRSSLinks('distribucion_gasto_hogar');

        //Captura de pantalla de la visualización
        setChartCanvas();

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('distribucion_gasto_hogar');
        });

        //Altura del frame
        setChartHeight(iframe);
    });    
}